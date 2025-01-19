import { streamToConsole } from '../utils/stream';
import { stdinToStream } from '../utils/stream';
import { createLibp2p } from './createNode';
import libp2pConfig from '../../shared/libp2p';
import { MimirP2PClient } from '../../shared/mimir';

createLibp2p(libp2pConfig).then(async (node) => {
	console.log(`Node listening on:`);
	node.getMultiaddrs().forEach((ma) => console.log(ma.toString()));

	const mimir = new MimirP2PClient(node, 'node');
	await mimir.start();
	// Log a message when a remote peer connects to us
	// node.addEventListener('peer:connect', (evt) => {
	// 	const remotePeer = evt.detail
	// 	console.log('\nconnected to Peer: ', remotePeer.toString())
	// })


	// // Handle messages for the protocol
	// await node.handle('/chat/1.0.0', async ({ stream }) => {
	// 	console.log('\nType something to send a message.')

	// 	stdinToStream(stream)
	// 	// Read the stream and output to console
	// 	streamToConsole(stream)
	// })
}).catch((e) => {
	console.error(e);
});
