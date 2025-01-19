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
