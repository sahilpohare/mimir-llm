import { createLibp2p, Libp2p } from "libp2p"
import libp2pConfig from "../../shared/libp2p"
import { MimirP2PClient, MimirPacket } from "../../shared/mimir";
import { createInterface } from "readline";
import { streamToConsole } from "../utils/stream";
import { ChatCompletion, ChatCompletionChunk, Completion } from "openai/resources";

async function main() {
	const libp2p = await createLibp2p(libp2pConfig);
	const client = new MimirP2PClient(libp2p);
	await client.start();

	// Read all messages from console and send them to the stream
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
// createLibp2p(libp2pConfig).then(async (dialer) => {
// 	// Create a new libp2p node on localhost with a randomly chosen port
// 	dialer.start()

// 	let streams = [];
// 	dialer.addEventListener('peer:discovery', (evt) => {
// 		const {
// 			id,
// 			multiaddrs
// 		} = evt.detail;

// 		// console.log('Discovered: ', id, multiaddrs.map
// 		const stream = dialer.dialProtocol(
// 			multiaddr(`${multiaddrs[0].toString()}/p2p/${id.toString()}`), '/chat/1.0.0');
// 		// streams.push(stream)

// 		stdinToStream(stream)
// 		streamToConsole(stream)
// 	});

// 	dialer.getMultiaddrs().forEach((ma) => {
// 		console.log(ma.toString())
// 	})

// 	// Prompt for the multiaddr
// 	const readline = createInterface({
// 		input: process.stdin,
// 		output: process.stdout
// 	});

// 	let targetAddress = await new Promise<string>((resolve) => {
// 		readline.question('Please enter the multiaddr to dial: ', (addr) => {
// 			readline.close();
// 			resolve(addr);
// 		});
// 	});

// 	while (!targetAddress) {
// 		console.error('A multiaddr is required.\nExample: /ip4/127.0.0.1/tcp/8080/p2p/QmHash..');
// 		const rl = createInterface({
// 			input: process.stdin,
// 			output: process.stdout
// 		});
// 		targetAddress = await new Promise<string>((resolve) => {
// 			rl.question('Please enter the multiaddr to dial: ', (addr) => {
// 				rl.close();
// 				resolve(addr);
// 			});
// 		});
// 	}


// 	// get the address to be dialled via cli args
// 	// const stream = await dialer.dialProtocol(multiaddr(targetAddress), '/chat/1.0.0')

// 	// // for await (let stream of streams) {
// 	// stdinToStream(stream)
// 	// streamToConsole(stream)
// 	// }

// 	// // Send stdin to the stream
// 	// stdinToStream(stream)
// 	// // Read the stream and output to console
// 	// streamToConsole(stream)

// }).catch((e) => {
// 	console.error(e);
// });