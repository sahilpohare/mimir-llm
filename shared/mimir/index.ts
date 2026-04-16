import { IncomingStreamData, PeerId, PeerInfo } from '@libp2p/interface'
import { multiaddr } from '@multiformats/multiaddr'
import { Libp2p } from 'libp2p'
import { CID } from 'multiformats'
import { pipe } from 'it-pipe'
import { PeerScheduler } from '../scheduler'

// ---------------------------------------------------------------------------
// Model registry
// ---------------------------------------------------------------------------

export const llmCidMap: Record<string, string> = {
    'llama3.2:latest': 'QmNizEt5WLyEDUHMqsm89RHHNR63DYUSdtS38AeG4XUV6C',
}

export type LlmModel = keyof typeof llmCidMap

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Sanitise a model name into a valid libp2p protocol string segment. */
export function modelToProtocol(model: string): string {
    return `/mimir/${model.replace(/[^a-zA-Z0-9._-]/g, '-')}/1.0.0`
}

async function getPeerMultiaddr(libp2p: Libp2p, peerId: PeerId): Promise<string | null> {
    try {
        const peer = await libp2p.peerStore.get(peerId)
        if (!peer.addresses.length) return null
        return `${peer.addresses[0].multiaddr.toString()}/p2p/${peerId.toString()}`
    } catch {
        return null
    }
}

// ---------------------------------------------------------------------------
// MimirNode — proxies libp2p streams to a local Ollama instance
// ---------------------------------------------------------------------------

export interface MimirNodeConfig {
    ollamaUrl?: string
}

export class MimirNode {
    private readonly ollamaUrl: string

    constructor(
        private readonly libp2p: Libp2p,
        config: MimirNodeConfig = {},
    ) {
        this.ollamaUrl = (config.ollamaUrl ?? 'http://localhost:11434').replace(/\/v1\/?$/, '')
    }

    async start(): Promise<void> {
        await this.libp2p.start()
        await this.registerModels()
        console.log('MimirNode started on:')
        this.libp2p.getMultiaddrs().forEach((ma) => console.log(' ', ma.toString()))
    }

    private async registerModels(): Promise<void> {
        let models: string[]
        try {
            const res = await fetch(`${this.ollamaUrl}/api/tags`)
            const json = await res.json() as { models: { name: string }[] }
            models = json.models.map((m) => m.name)
        } catch (err) {
            console.error('Failed to fetch models from Ollama:', err)
            return
        }

        for (const model of models) {
            const cid = llmCidMap[model]
            const protocol = modelToProtocol(model)

            this.libp2p.handle(protocol, (data) => this.handleStream(data, model))
            console.log('Registered protocol:', protocol)

            if (cid) {
                // Non-blocking — provide() can take a long time on sparse networks
                this.libp2p.contentRouting.provide(CID.parse(cid))
                    .then(() => console.log('Advertising via DHT:', model))
                    .catch((err: any) => {
                        if (err?.type !== 'aborted') console.error('DHT provide failed for', model, err)
                    })
            }
        }
    }

    private async handleStream({ stream }: IncomingStreamData, model: string): Promise<void> {
        // Read the full HTTP request from the libp2p stream
        const chunks: Uint8Array[] = []
        for await (const chunk of stream.source) {
            chunks.push(chunk instanceof Uint8Array ? chunk : chunk.slice())
        }

        const requestBytes = mergeChunks(chunks)
        if (!requestBytes.length) return // probe dial — no request body

        const { method, path, headers, body } = parseHttpRequest(requestBytes)

        // Rewrite the request to target the local Ollama instance
        const url = `${this.ollamaUrl}${path}`
        let ollamaRes: Response
        try {
            ollamaRes = await fetch(url, { method, headers, body: body.length ? body : undefined })
        } catch (err) {
            console.error('Ollama request failed:', err)
            await stream.close()
            return
        }

        // Stream the raw HTTP response back
        const statusLine = `HTTP/1.1 ${ollamaRes.status} ${ollamaRes.statusText}\r\n`
        const responseHeaders = [...ollamaRes.headers.entries()]
            .map(([k, v]) => `${k}: ${v}`)
            .join('\r\n')
        const headerBytes = encoder.encode(`${statusLine}${responseHeaders}\r\n\r\n`)

        await pipe(
            (async function* () {
                yield headerBytes
                if (ollamaRes.body) {
                    const reader = ollamaRes.body.getReader()
                    while (true) {
                        const { done, value } = await reader.read()
                        if (done) break
                        yield value
                    }
                }
            })(),
            stream.sink,
        )
    }
}

// ---------------------------------------------------------------------------
// MimirClient — discovers peers, routes requests, exposes tunneled fetch
// ---------------------------------------------------------------------------

export interface MimirClientConfig {
    discoveryTimeoutMs?: number
}

export class MimirClient {
    // model name → set of peerIds that have it
    private readonly peersByModel: Map<string, Set<PeerId>> = new Map()
    private readonly scheduler = new PeerScheduler()
    private readonly discoveryTimeoutMs: number

    constructor(
        private readonly libp2p: Libp2p,
        config: MimirClientConfig = {},
    ) {
        this.discoveryTimeoutMs = config.discoveryTimeoutMs ?? 5_000
    }

    async start(): Promise<void> {
        this.libp2p.addEventListener('peer:discovery', this.onDiscovery.bind(this))
        this.libp2p.addEventListener('peer:disconnect', this.onDisconnect.bind(this))
        await this.libp2p.start()
        console.log('MimirClient started on:')
        this.libp2p.getMultiaddrs().forEach((ma) => console.log(' ', ma.toString()))

        for (const [model, cid] of Object.entries(llmCidMap)) {
            this.queryDHT(model, cid).catch((err) => console.error('DHT query failed:', err))
        }
    }

    /**
     * Returns a fetch() function that tunnels HTTP requests through a libp2p
     * stream to the best available peer for the given model.
     *
     * Pass this to OllamaClient as the fetchFn parameter.
     */
    fetchFor(model: string): typeof fetch {
        return async (input: RequestInfo | URL, init?: RequestInit) => {
            const peers = this.peersByModel.get(model)
            if (!peers?.size) throw new Error(`No peers available for model: ${model}`)

            const peerId = this.scheduler.pick(peers)
            if (!peerId) throw new Error('Scheduler returned no peer')

            const done = this.scheduler.begin(peerId)
            const t0 = Date.now()

            const protocol = modelToProtocol(model)
            const stream = await this.dial(peerId, protocol)
            if (!stream) {
                done(Date.now() - t0)
                throw new Error(`Failed to dial peer ${peerId.toString()} for ${protocol}`)
            }

            try {
                // Serialise the fetch request into raw HTTP/1.1 bytes
                const url = typeof input === 'string' ? new URL(input) : input instanceof URL ? input : new URL(input.url)
                const method = init?.method ?? 'POST'
                const body = init?.body ? new Uint8Array(await new Response(init.body).arrayBuffer()) : null
                const reqHeaders: Record<string, string> = {
                    'Host': url.host,
                    'Connection': 'close',
                    ...(body ? { 'Content-Length': String(body.byteLength) } : {}),
                    ...(init?.headers ? Object.fromEntries(new Headers(init.headers as HeadersInit).entries()) : {}),
                }

                const headerStr = Object.entries(reqHeaders).map(([k, v]) => `${k}: ${v}`).join('\r\n')
                const requestLine = `${method} ${url.pathname}${url.search} HTTP/1.1\r\n${headerStr}\r\n\r\n`
                const requestLineBytes = encoder.encode(requestLine)

                await pipe(
                    (async function* () {
                        yield requestLineBytes
                        if (body) yield body
                    })(),
                    stream.sink,
                )

                // Read the raw HTTP response from the stream
                const responseChunks: Uint8Array[] = []
                for await (const chunk of stream.source) {
                    responseChunks.push(chunk instanceof Uint8Array ? chunk : chunk.slice())
                }

                done(Date.now() - t0)

                const responseBytes = mergeChunks(responseChunks)
                return parseHttpResponse(responseBytes)
            } catch (err) {
                done(Date.now() - t0)
                throw err
            }
        }
    }

    private onDisconnect(evt: CustomEvent<PeerId>): void {
        const peerId = evt.detail
        console.log('Disconnected from peer:', peerId.toString())
        this.scheduler.remove(peerId)
        for (const peers of this.peersByModel.values()) {
            for (const p of peers) {
                if (p.equals(peerId)) peers.delete(p)
            }
        }
    }

    private async onDiscovery(evt: CustomEvent<PeerInfo>): Promise<void> {
        const { id } = evt.detail
        console.log('Discovered peer:', id.toString())
        await this.probeModels(id)
    }

    private async queryDHT(model: string, cid: string): Promise<void> {
        try {
            for await (const provider of this.libp2p.contentRouting.findProviders(CID.parse(cid))) {
                const peerId = provider.id
                if (!this.hasPeer(model, peerId)) {
                    console.log('Found provider via DHT:', peerId.toString(), 'for', model)
                    this.addPeer(model, peerId)
                }
            }
        } catch (err) {
            console.error('queryDHT unavailable:', err)
        }
    }

    /**
     * Probe which models a peer supports by attempting dialProtocol for each
     * known model. If the dial succeeds, the peer has that model.
     */
    private async probeModels(peerId: PeerId): Promise<void> {
        for (const model of Object.keys(llmCidMap)) {
            const protocol = modelToProtocol(model)
            try {
                const stream = await this.libp2p.dialProtocol(
                    multiaddr((await getPeerMultiaddr(this.libp2p, peerId))!),
                    protocol,
                )
                await stream.close()
                this.addPeer(model, peerId)
            } catch {
                // peer doesn't support this model — expected, not an error
            }
        }
    }

    private async dial(peerId: PeerId, protocol: string) {
        const ma = await getPeerMultiaddr(this.libp2p, peerId)
        if (!ma) return null
        try {
            return await this.libp2p.dialProtocol(multiaddr(ma), protocol)
        } catch (err) {
            console.error(`dial ${protocol} to ${peerId.toString()} failed:`, err)
            return null
        }
    }

    private addPeer(model: string, peerId: PeerId): void {
        if (!this.peersByModel.has(model)) this.peersByModel.set(model, new Set())
        this.peersByModel.get(model)!.add(peerId)
        this.scheduler.register(peerId)
        console.log('Peer registered for model', model, '→', peerId.toString())
    }

    private hasPeer(model: string, peerId: PeerId): boolean {
        return Array.from(this.peersByModel.get(model) ?? []).some((p) => p.equals(peerId))
    }
}

// ---------------------------------------------------------------------------
// Raw HTTP helpers
// ---------------------------------------------------------------------------

const encoder = new TextEncoder()
const decoder = new TextDecoder()

function mergeChunks(chunks: Uint8Array[]): Uint8Array {
    const total = chunks.reduce((n, c) => n + c.byteLength, 0)
    const out = new Uint8Array(total)
    let offset = 0
    for (const c of chunks) { out.set(c, offset); offset += c.byteLength }
    return out
}

function parseHttpRequest(bytes: Uint8Array): {
    method: string; path: string; headers: Record<string, string>; body: Uint8Array
} {
    const raw = decoder.decode(bytes)
    const headerEnd = raw.indexOf('\r\n\r\n')
    const headerSection = raw.slice(0, headerEnd)
    const lines = headerSection.split('\r\n')
    const [method, path] = lines[0].split(' ')
    const headers: Record<string, string> = {}
    for (const line of lines.slice(1)) {
        const colon = line.indexOf(':')
        if (colon !== -1) headers[line.slice(0, colon).trim().toLowerCase()] = line.slice(colon + 1).trim()
    }
    const body = bytes.slice(encoder.encode(raw.slice(0, headerEnd + 4)).byteLength)
    return { method, path, headers, body }
}

function parseHttpResponse(bytes: Uint8Array): Response {
    const raw = decoder.decode(bytes)
    const headerEnd = raw.indexOf('\r\n\r\n')
    const headerSection = raw.slice(0, headerEnd)
    const lines = headerSection.split('\r\n')
    const statusMatch = lines[0].match(/HTTP\/\S+ (\d+)/)
    const status = statusMatch ? parseInt(statusMatch[1]) : 200
    const headers = new Headers()
    for (const line of lines.slice(1)) {
        const colon = line.indexOf(':')
        if (colon !== -1) headers.append(line.slice(0, colon).trim(), line.slice(colon + 1).trim())
    }
    const bodyBytes = bytes.slice(encoder.encode(raw.slice(0, headerEnd + 4)).byteLength)
    return new Response(bodyBytes, { status, headers })
}
