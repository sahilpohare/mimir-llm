import { tcp } from '@libp2p/tcp'
import { mdns } from '@libp2p/mdns'
import { bootstrap } from '@libp2p/bootstrap'
import { identify } from '@libp2p/identify'
import { noise } from '@chainsafe/libp2p-noise'
import { yamux } from '@chainsafe/libp2p-yamux'
import { Libp2pOptions } from 'libp2p'
import {
  kadDHT,
  removePrivateAddressesMapper
} from '@libp2p/kad-dht';

export const libp2pConfig: Libp2pOptions = {
  addresses: {
    listen: [
      "/ip4/0.0.0.0/tcp/0"
    ]
  },
  transports: [
    tcp()
  ],
  peerDiscovery: [
    mdns(),
    // bootstrap({
    //   list: [
    //     "/ip4/104.131.131.82/tcp/4001/ipfs/QmaCpDMGvV2BGHeYERUEnRQAwe3N8SzbUtfsmvsqQLuvuJ",
    //     "/dnsaddr/bootstrap.libp2p.io/ipfs/QmNnooDu7bfjPFoTZYxMNLWUQJyrVwtbZg5gBMjTezGAJN",
    //     "/dnsaddr/bootstrap.libp2p.io/ipfs/QmQCU2EcMqAqQPR2i9bChDtGNJchTbq5TbXJJ16u19uLTa",
    //   ]
    // })
  ],
  services: {
    identify: identify({

    }),
    aminoDHT: kadDHT({
      protocol: '/ipfs/kad/1.0.0',
      peerInfoMapper: removePrivateAddressesMapper
    })
    // pubsub: gossipsub()
  },
  connectionEncrypters: [
    noise()
  ],
  streamMuxers: [
    yamux()
  ]
}

export default libp2pConfig
