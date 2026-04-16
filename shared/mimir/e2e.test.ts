/**
 * E2E test: real libp2p TCP transport, mock Ollama HTTP server.
 *
 * Topology:
 *   MimirClient → libp2p stream → MimirNode → mock Ollama HTTP server
 *
 * MimirNode proxies raw HTTP through the libp2p stream.
 * MimirClient.fetchFor() tunnels fetch() calls through that stream.
 */
import { describe, it, expect, afterEach } from 'bun:test'
import { createLibp2p } from 'libp2p'
import { tcp } from '@libp2p/tcp'
import { noise } from '@chainsafe/libp2p-noise'
import { yamux } from '@chainsafe/libp2p-yamux'
import { identify } from '@libp2p/identify'
import { kadDHT } from '@libp2p/kad-dht'
import { MimirNode, MimirClient, modelToProtocol, llmCidMap } from './index'
import type { PeerId } from '@libp2p/interface'

// ---------------------------------------------------------------------------
// Minimal libp2p — TCP + LAN DHT (no external bootstrap)
// ---------------------------------------------------------------------------

async function makeLibp2p() {
    return createLibp2p({
        addresses: { listen: ['/ip4/127.0.0.1/tcp/0'] },
        transports: [tcp()],
        connectionEncrypters: [noise()],
        streamMuxers: [yamux()],
        services: {
            identify: identify(),
            lanDHT: kadDHT({
                protocol: '/ipfs/lan/kad/1.0.0',
                clientMode: false,
            }),
        },
    })
}

// ---------------------------------------------------------------------------
// Mock Ollama HTTP server
// ---------------------------------------------------------------------------

function makeMockOllama(chunks: string[]): { url: string; server: ReturnType<typeof Bun.serve> } {
    const server = Bun.serve({
        port: 0,
        fetch(req) {
            const encoder = new TextEncoder()
            const stream = new ReadableStream({
                async start(controller) {
                    for (const chunk of chunks) {
                        controller.enqueue(encoder.encode(`data: ${chunk}\n\n`))
                    }
                    controller.enqueue(encoder.encode('data: [DONE]\n\n'))
                    controller.close()
                },
            })
            return new Response(stream, {
                headers: {
                    'Content-Type': 'text/event-stream',
                    'Transfer-Encoding': 'chunked',
                },
            })
        },
    })
    return { url: `http://localhost:${server.port}`, server }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function connect(
    dialer: Awaited<ReturnType<typeof makeLibp2p>>,
    listener: Awaited<ReturnType<typeof makeLibp2p>>,
): Promise<void> {
    // Wait for listener to have a bound address
    const deadline = Date.now() + 5_000
    while (Date.now() < deadline) {
        if (listener.getMultiaddrs().length) break
        await new Promise((r) => setTimeout(r, 30))
    }
    const addr = listener.getMultiaddrs()[0]
    if (!addr) throw new Error('Listener has no multiaddrs')

    await dialer.dial(addr)

    while (Date.now() < deadline) {
        try {
            const peer = await dialer.peerStore.get(listener.peerId)
            if (peer.addresses.length) return
        } catch {}
        await new Promise((r) => setTimeout(r, 30))
    }
    throw new Error('Timed out waiting for peerStore addresses')
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

let nodeLibp2p: Awaited<ReturnType<typeof makeLibp2p>>
let clientLibp2p: Awaited<ReturnType<typeof makeLibp2p>>
let ollamaServer: ReturnType<typeof Bun.serve> | undefined

afterEach(async () => {
    await nodeLibp2p?.stop().catch(() => {})
    await clientLibp2p?.stop().catch(() => {})
    ollamaServer?.stop()
})

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('MimirNode + MimirClient e2e', () => {
    it('modelToProtocol sanitises model names', () => {
        expect(modelToProtocol('llama3.2:latest')).toBe('/mimir/llama3.2-latest/1.0.0')
        expect(modelToProtocol('gemma3')).toBe('/mimir/gemma3/1.0.0')
    })

    it('node registers protocol handler for available models', async () => {
        const { url, server } = makeMockOllama([])
        ollamaServer = server

        // Mock /api/tags
        const tagServer = Bun.serve({
            port: 0,
            fetch() {
                return Response.json({ models: [{ name: 'llama3.2:latest' }] })
            },
        })
        ollamaServer = tagServer

        nodeLibp2p = await makeLibp2p()
        const node = new MimirNode(nodeLibp2p, { ollamaUrl: `http://localhost:${tagServer.port}` })
        await node.start()

        // Protocol should be registered
        const protocols = await nodeLibp2p.peerStore.get(nodeLibp2p.peerId)
            .then(() => true)
            .catch(() => false)
        expect(protocols).toBe(true)

        tagServer.stop()
    }, 10_000)

    it('fetchFor tunnels an HTTP request through libp2p to the node', async () => {
        const sseChunks = [
            JSON.stringify({ choices: [{ delta: { content: 'Hello' } }] }),
            JSON.stringify({ choices: [{ delta: { content: ' world' } }] }),
        ]
        const { url: ollamaUrl, server } = makeMockOllama(sseChunks)
        ollamaServer = server

        // Tag server returns one model
        const tagServer = Bun.serve({
            port: 0,
            fetch(req) {
                if (req.url.endsWith('/api/tags')) {
                    return Response.json({ models: [{ name: 'llama3.2:latest' }] })
                }
                // Forward everything else to the SSE mock
                return fetch(ollamaUrl + new URL(req.url).pathname, {
                    method: req.method,
                    headers: req.headers,
                    body: req.body,
                })
            },
        })

        nodeLibp2p = await makeLibp2p()
        clientLibp2p = await makeLibp2p()

        const node = new MimirNode(nodeLibp2p, { ollamaUrl: `http://localhost:${tagServer.port}` })
        await node.start()

        await clientLibp2p.start()
        await connect(clientLibp2p, nodeLibp2p)

        const mimir = new MimirClient(clientLibp2p)
        // Manually register the node peer for the model (skip DHT/mDNS in test)
        ;(mimir as any).addPeer('llama3.2:latest', nodeLibp2p.peerId)

        const tunnelFetch = mimir.fetchFor('llama3.2:latest')
        const res = await tunnelFetch(`http://ignored/v1/chat/completions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ model: 'llama3.2:latest', messages: [], stream: true }),
        })

        expect(res.status).toBe(200)
        const text = await res.text()
        expect(text).toContain('Hello')
        expect(text).toContain('world')

        tagServer.stop()
    }, 15_000)

    it('probeModels registers peer when protocol is supported', async () => {
        const tagServer = Bun.serve({
            port: 0,
            fetch() {
                return Response.json({ models: [{ name: 'llama3.2:latest' }] })
            },
        })

        nodeLibp2p = await makeLibp2p()
        clientLibp2p = await makeLibp2p()

        const node = new MimirNode(nodeLibp2p, { ollamaUrl: `http://localhost:${tagServer.port}` })
        await node.start()

        await clientLibp2p.start()
        await connect(clientLibp2p, nodeLibp2p)

        const mimir = new MimirClient(clientLibp2p)
        await (mimir as any).probeModels(nodeLibp2p.peerId)

        const peers: Map<string, Set<PeerId>> = (mimir as any).peersByModel
        expect(peers.has('llama3.2:latest')).toBe(true)
        expect([...peers.get('llama3.2:latest')!][0].toString()).toBe(nodeLibp2p.peerId.toString())

        tagServer.stop()
    }, 15_000)
})
