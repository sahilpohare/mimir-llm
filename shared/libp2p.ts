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

// Well-known IPFS bootstrap nodes — provide initial routing table entries
// so the node can reach peers outside the local network via Kademlia DHT.
const BOOTSTRAP_LIST = [
  '/dnsaddr/bootstrap.libp2p.io/p2p/QmNnooDu7bfjPFoTZYxMNLWUQJyrVwtbZg5gBMjTezGAJN',
  '/dnsaddr/bootstrap.libp2p.io/p2p/QmQCU2EcMqAqQPR2i9bChDtGNJchTbq5TbXJJ16u19uLTa',
  '/dnsaddr/bootstrap.libp2p.io/p2p/QmbLHAnMoJPWSCR5Zhtx6BHJX9KiKNN6tpvbUcqanj75Nb',
  '/dnsaddr/bootstrap.libp2p.io/p2p/QmcZf59bWwK5XFi76CZX8cbJ4BhTzzA3gU1ZjYZcYW3dwt',
  '/ip4/104.131.131.82/tcp/4001/p2p/QmaCpDMGvV2BGHeYERUEnRQAwe3N8SzbUtfsmvsqQLuvuJ',
];

export const libp2pConfig: Libp2pOptions = {
  addresses: {
    listen: [
      '/ip4/0.0.0.0/tcp/0'
    ]
  },
  transports: [
    tcp()
  ],
  peerDiscovery: [
    // LAN discovery — zero-config, works immediately on local network
    mdns(),
    // WAN discovery — connects to well-known peers to seed the DHT routing table
    bootstrap({
      list: BOOTSTRAP_LIST,
      timeout: 10_000,
    }),
  ],
  services: {
    identify: identify(),
    // Kademlia DHT for content routing (provide/findProviders) and peer routing
    aminoDHT: kadDHT({
      protocol: '/ipfs/kad/1.0.0',
      peerInfoMapper: removePrivateAddressesMapper,
    }),
    // LAN-mode DHT without the public address filter for local-only deployments
    lanDHT: kadDHT({
      protocol: '/ipfs/lan/kad/1.0.0',
      clientMode: false,
    }),
  },
  connectionEncrypters: [
    noise()
  ],
  streamMuxers: [
    yamux()
  ]
}

export default libp2pConfig
