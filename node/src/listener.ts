import { createLibp2p } from 'libp2p'
import libp2pConfig from '../../shared/libp2p'
import { MimirNode } from '../../shared/mimir'

async function main() {
    const libp2p = await createLibp2p(libp2pConfig)
    const node = new MimirNode(libp2p, {
        ollamaUrl: process.env.OLLAMA_ENDPOINT ?? 'http://localhost:11434',
    })
    await node.start()
}

main().catch(console.error)
