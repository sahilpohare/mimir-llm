
# MimirLLM

MimirLLM is a library that facilitates peer-to-peer communication for AI-driven language models using libp2p. It supports querying available models, sending messages, and receiving responses from peers hosting LLMs (Large Language Models). It is designed to operate in either client or node mode, enabling both lightweight clients and full-service nodes in the network.

This is a proof-of-concept implementation and is not intended for production use. It is part of the Mimir project, a decentralized AI platform that aims to democratize access to AI models and data.

## Features
- **Peer Discovery:** Automatically discovers peers in the network and connects to them.
- **LLM Advertisement:** Nodes can advertise hosted LLMs to the network.
- **Message Handling:** Supports sending and receiving structured messages for LLM interactions.
- **Protocol Management:** Uses a custom protocol (/mimirllm/1.0.0) for communication.
- **OpenAI and Custom Models:** Integrates with OpenAI API or custom implementations like Ollama.

## How the protocol operates
The protocol is divied into two main parts: the `Discovery` and the `LLM` part

### Discovery and Handshake `/mimirllm/1.0.0/identify`
The Discovery part is responsible for finding peers in the network and connecting to them. It uses the `/mimirllm/1.0.0/identify` protocol to exchange information about the node. 

1. The client sends a `query` event to the node and the node responds with the `models` it has access to. 
2. The once successful, the client then stores the node's information into an internal list of known nodes.

### LLM Interaction `/mimirllm/1.0.0` 
The LLM is responsible for the actual interaction with the LLM. It uses the `/mimirllm/1.0.0` protocol to exchange messages with the LLM.

1. When a client wants to interact with an LLM, it looks up the nodes serving the LLM CID and sends a `message` event to the node.
   
2.  The node then forwards the message to the LLM and returns the response to the client.

## Installation

### Requirements
- Node.js v22.13.0 (LTS) or later (might work with older versions but not tested)
- Ollama or OpenAI API key (optional)
- IPFS node (optional)

```bash
git clone <repo>
cd <repo>

# Install dependencies
npm install
```

## Usage

#### Node Mode
```typescript
// Node mode
import { createLibp2p } from './createNode';
import libp2pConfig from '../../shared/libp2p';
import { MimirP2PClient } from '../../shared/mimir';

createLibp2p(libp2pConfig).then(async (node) => {
	console.log(`Node listening on:`);
	node.getMultiaddrs().forEach((ma) => console.log(ma.toString()));

	const mimir = new MimirP2PClient(node, {
		mode: "node",
		openaiConfig: {
			baseUrl: process.env.OLLAMA_ENDPOINT
		}
	});
	await mimir.start();
}).catch((e) => {
	console.error(e);
});
```

#### Client Mode
```typescript
// Client mode
import { createLibp2p, Libp2p } from "libp2p"
import libp2pConfig from "../../shared/libp2p"
import { MimirP2PClient, MimirPacket } from "../../shared/mimir";
import { createInterface } from "readline";
import { streamToConsole } from "../utils/stream";
import { ChatCompletionChunk } from "openai/resources";

async function main() {
	const libp2p = await createLibp2p(libp2pConfig);
	const client = new MimirP2PClient(libp2p, {
		mode: "client",
		openaiConfig: {
			baseUrl: process.env.OLLAMA_ENDPOINT
		}
	});
	await client.start();

	while (true) {
		const message = await new Promise<string>((resolve) => {
			const readline = createInterface({
				input: process.stdin,
				output: process.stdout
			})
			readline.question('Enter message: ', (message) => {
				readline.close();
				resolve(message);
			});
		}
		);

		if (message === 'exit') {
			break;
		}

		const stream = await client.sendMessage({
			messages: [
				{
					"role": "system",
					content: "You are a helpful assistant"
				},
				{
					"role": "user",
					content: message
				}
			]
		});


		streamToConsole(stream, (msg) => {
			const data = JSON.parse(msg) as MimirPacket<ChatCompletionChunk>;
			process.stdout.write(data.data.choices[0].delta.content);
		});
	}
}

main().catch((e) => {
	console.error(e);
});
```

## Backlog
- [ ] Implement a more robust discovery mechanism
- [ ] Merge the two protocols into one
- [ ] Make the peer querying more efficient
- [ ] Turn this into a blockchain where nodes can be rewarded for hosting LLMs