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