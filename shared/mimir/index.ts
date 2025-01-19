import { createInterface } from "readline";
import { stdin } from "process";
import { Connection, IncomingStreamData, Peer, PeerId, PeerInfo, Stream } from "@libp2p/interface";
import { pipe } from "it-pipe";
import * as lp from "it-length-prefixed";
import map from "it-map";
import { toString as uint8ArrayToString } from "uint8arrays/to-string";
import { fromString as uint8ArrayFromString } from "uint8arrays/from-string";
import { multiaddr } from "@multiformats/multiaddr";
import { Libp2p } from "libp2p";
import { randomUUID } from "crypto";
import { CID } from "multiformats";
import OpenAI from "openai";
import { OllamaClient } from "./ollama";
import { ChatCompletionChunk } from "openai/resources";

export const llmCidMap = {
    'llama3.2:latest': 'QmNizEt5WLyEDUHMqsm89RHHNR63DYUSdtS38AeG4XUV6C'
}

// type of keys in llmCidMap
export type LlmModel = keyof typeof llmCidMap;

export interface MimirPacket<
    T = LLMPacket | string | OllamaChatCompletionRequest | OpenAI.ChatCompletion | Array<LlmModel> | null | OpenAI.ChatCompletionChunk
> {
    event: 'message' | 'command' | 'query' | 'response' | 'completionStart' | 'completionPacket' | 'completionStop'
    request_id?: string;
    data: T;
}

export interface LLMPacket {
    model: string;
    created_at: Date;
    response: string;
    done: boolean;
}

export interface LLMPeer {
    peerId: PeerId;
    llmCID: CID;
}

type OllamaChatCompletionRequest = Omit<OpenAI.ChatCompletionCreateParams, 'model'>;

export interface MimirConfig {
    mode: 'client' | 'node';
    openaiConfig: {
        apiKey?: string;
        baseUrl: string;
    };
    protocol?: string;
    openAIClient?: OpenAI;
}

export class MimirP2PClient {
    private llmPeerMap: Set<LLMPeer> = new Set();
    private requests: Map<string, string> = new Map();
    private protocol: string;
    private llm: OpenAI;

    constructor(
        private libp2p: Libp2p,
        private config: MimirConfig,
    ) {
        this.protocol = config.protocol || '/mimirllm/1.0.0';
        this.llm = config.openAIClient || new OllamaClient(config.openaiConfig.baseUrl, config.openaiConfig.apiKey);
    }

    async start() {
        if (this.config.mode === 'client') {
            this.libp2p.addEventListener('peer:discovery', this.onDiscovery.bind(this));
        }

        this.libp2p.addEventListener('peer:connect', this.onPeerConnect.bind(this));
        this.libp2p.addEventListener('peer:disconnect', this.onDisconnect.bind(this));

        console.log(`Node listening on:`);
        this.libp2p.getMultiaddrs().forEach((ma) => console.log(ma.toString()));

        if (this.config.mode === 'node') {
            this.libp2p.handle(this.config.protocol, this.handleProtocol.bind(this));
            this.libp2p.handle(this.config.protocol + '/identify', this.handleIdentify.bind(this));
        }

        if (this.config.mode === 'node') {
            await this.advertiseLLM();
        }

        await this.libp2p.start();
    }

    onDisconnect(
        evt: CustomEvent<PeerId>
    ) {
        const peerId = evt.detail;
        console.log('\nDisconnected from Peer:', peerId.toString());

        this.llmPeerMap.forEach((peer) => {
            if (peer.peerId.equals(peerId)) {
                this.llmPeerMap.delete(peer);
            }
        });
    }

    // This method is used to query peers that are hosting specific LLMs
    async queryPeers(llmCID: string) {
        // const providers = this.libp2p.contentRouting.findProviders(
        //     CID.parse(llmCID), {
        //     useCache: true,
        //     useNetwork: true
        // });

        // const results = [];
        // for await (const provider of providers) {
        //     const peerId = provider.id.toString();
        //     results.push(peerId);
        //     this.llmPeerMap.add({
        //         peerId,
        //         llmCID: CID.parse(llmCID)
        //     });
        // }
        // return results;
    }

    async handleIdentify({ connection, stream }: IncomingStreamData) {
        for await (const msg of this.receiveFromStream(stream)) {
            if (msg.event === 'query') {
                console.log('Query from peer:', msg.data);
                await this.sendToStream(stream, {
                    event: 'response',
                    request_id: msg.request_id,
                    data: ['llama3.2:latest']
                } as MimirPacket<Array<LlmModel>>);
            }
        }
    }

    async handleProtocol({ connection, stream }: IncomingStreamData) {
        for await (const msg of this.receiveFromStream(stream)) {
            if (msg.event === 'message') {
                this.handleMessage(
                    connection,
                    stream,
                    msg as MimirPacket<OllamaChatCompletionRequest>
                );
            }
        }
    }

    async sendMessage(
        request: OllamaChatCompletionRequest
    ): Promise<Stream> {
        console.log('Sending message:', request);
        if (this.llmPeerMap.size === 0) {
            console.log('No peers available to send message to.');
            return;
        }

        const llmPeer = Array.from(this.llmPeerMap).filter((peer) => peer.llmCID.toString() === llmCidMap["llama3.2:latest"])[0];

        console.log(this.llmPeerMap);
        console.log(llmPeer);

        const stream = await this.dialPeer(llmPeer.peerId);

        await this.sendToStream(stream, {
            event: 'message',
            data: request
        } as MimirPacket<OllamaChatCompletionRequest>);

        return stream;
    }

    private async handleMessage(conn: Connection, stream: Stream, msg: MimirPacket<OllamaChatCompletionRequest>) {
        const { data } = msg;

        console.log('Received message:', data);
        const llmRequest = {
            ...data,
            model: 'llama3.2:latest',
            stream: true
        } as OpenAI.ChatCompletionCreateParamsStreaming;

        const res = await this.llm.chat.completions.create(llmRequest);

        pipe(
            res,
            (source) => map(source, (data) => ({
                event: 'completionPacket',
                data: data
            }) as MimirPacket<ChatCompletionChunk>),
            (source) => map(source, (data) => JSON.stringify(data)),
            (source) => map(source, (string) => uint8ArrayFromString(string)),
            lp.encode,
            stream.sink
        )
    }

    private onPeerConnect(event: CustomEvent<PeerId>) {
        const peerId = event.detail;
        // console.log('\nConnected to Peer:', peerId.toString());
        // console.log('\nExpecting messages from peer... you can type now.');
    }

    private async onDiscovery(event: CustomEvent<PeerInfo>) {
        const peerInfo = event.detail;
        console.log('Discovered:', peerInfo.id.toString());

        try {
            await this.dialDiscovery(
                peerInfo.id,
                llmCidMap['llama3.2:latest']
            )
        } catch (error) {
            console.error('Failed to dial peer:', error);
        }
    }

    private async advertiseLLM() {
        // advertise the LLM to the network
        // so that other peers can query it

        const models = await this.llm.models.list();
        console.log('Advertised models:', models);

        const llmCIDs = ['QmNizEt5WLyEDUHMqsm89RHHNR63DYUSdtS38AeG4XUV6C'];

        for (const llmCID of llmCIDs) {
            this.libp2p.contentRouting.provide(CID.parse(llmCID));
        }
        // models.
    }

    private async sendToStream(stream: Stream, data: MimirPacket): Promise<void> {
        const dataString = JSON.stringify(data);

        console.log('Sending:', dataString);
        console.log('Stream:', stream.status);

        await pipe(
            [dataString],
            (source) => map(source, (string) => uint8ArrayFromString(string)),
            lp.encode,
            stream.sink
        );

        console.log('Sent:', dataString);
    }

    private async *receiveFromStream(stream: Stream): AsyncGenerator<MimirPacket> {
        yield* pipe(
            stream.source,
            lp.decode,
            (source) => map(source, (buf) => uint8ArrayToString(buf.subarray())),
            async function* (source) {
                for await (const msg of source) {
                    console.log('Received:', msg);
                    yield JSON.parse(msg) as MimirPacket;
                }
            }
        );
    }

    async dialDiscovery(peerId: PeerId, llmCID: string) {
        let stream: Stream | null = null;
        const request_id = randomUUID();

        const peer = await this.libp2p.peerStore.get(peerId);
        const ma = peer.addresses[0].multiaddr.toString();

        try {
            const fullMultiaddr = `${ma}/p2p/${peerId.toString()}`;
            stream = await this.libp2p.dialProtocol(multiaddr(fullMultiaddr), this.config.protocol + '/identify');
            this.requests.set(request_id, fullMultiaddr);

            await this.sendToStream(stream, {
                event: 'query',
                request_id,
                data: llmCID
            });

            const timeout = new Promise<null>((_, reject) => setTimeout(async () => {
                if (this.requests.has(request_id)) {
                    this.requests.delete(request_id);
                    if (stream && stream.status !== 'closed') {
                        await stream.close();
                        console.log('Disconnected peer due to timeout:', peerId.toString());
                    }
                    reject(new Error('Timeout waiting for response'));
                }
            }, 5000));

            const response = (async () => {
                for await (const msg of this.receiveFromStream(stream!)) {
                    if (msg.event === 'response' && this.requests.has(msg.request_id)) {
                        const data = msg.data as Array<LlmModel>;
                        this.requests.delete(msg.request_id);

                        for (const model of data) {
                            const llmCID = llmCidMap[model];
                            if (llmCID) {
                                this.llmPeerMap.add({
                                    peerId,
                                    llmCID: CID.parse(llmCID)
                                });

                                console.log("Peer added to llmPeerMap:", peerId);
                                console.log("llmPeerMap:", this.llmPeerMap);
                            }
                        }
                    }
                    stream.close();
                    break;
                }
            })();

        } catch (error) {
            console.error('Failed to dial peer:', error);
            if (stream && stream.status !== 'closed') {
                await stream.close();
                console.log('Disconnected peer due to error:', peerId);
            }
        }
    }

    private async dialPeer(peerId: PeerId): Promise<Stream | null> {
        let stream: Stream | null = null;
        const request_id = randomUUID();

        const peer = await this.libp2p.peerStore.get(peerId);
        const ma = peer.addresses[0].multiaddr.toString();

        console.log('Dialing peer:', peerId.toString(), ma);
        try {
            stream = await this.libp2p.dialProtocol(multiaddr(`${ma}/p2p/${peerId.toString()}`), this.config.protocol);
        } catch (error) {
            console.error('Failed to dial peer:', error);
            if (stream) {
                await stream.close();
                console.log('Disconnected peer due to error:', peerId);
            }
        }

        return stream;
    }
}
