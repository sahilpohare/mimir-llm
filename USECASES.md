# Use Cases

## 1. Shared GPU in a local network

A team has one machine with a GPU running Ollama. Everyone else on the LAN wants to use it without configuring anything.

- The GPU machine runs `MimirNode` — it advertises models via mDNS automatically
- Everyone else runs `MimirClient` — they discover the node within seconds, no IP addresses or ports to configure
- Requests are load-balanced across any nodes that appear; if the GPU machine goes offline, the client falls back to others

## 2. Distributed inference across a home lab

A hobbyist has several machines (desktop, NAS, old laptop) each running different models.

- Each machine runs `MimirNode` with whatever models Ollama has loaded
- A single `MimirClient` on any machine sees all of them as one pool
- The scheduler routes each request to the least-loaded peer with the right model
- No central server, no configuration file listing IPs — mDNS handles it

## 3. Offline-first AI assistant

A field team operates in environments with intermittent or no internet access (ships, remote sites, air-gapped facilities).

- Nodes pre-load models before going offline
- mDNS discovery works entirely on the local network — no internet required
- The OpenAI-compatible interface means existing tools (chat UIs, scripts, IDE plugins) work without modification

## 4. WAN peer pool via DHT

A community wants to share compute across multiple sites or cities without a central coordinator.

- Nodes advertise model CIDs on the Kademlia DHT
- Clients anywhere on the internet find providers via `findProviders`
- Mimir handles peer selection and tunnelling; the application sees a standard OpenAI API

## 5. Privacy-preserving inference

A user wants to use a capable model without sending prompts to a cloud provider.

- They connect to a trusted peer (friend, colleague, private server) running a local model
- Traffic is encrypted end-to-end by libp2p's Noise protocol
- No third party sees the request or response

## 6. Developer sandboxing

A developer wants to run integration tests against a real LLM without hitting rate limits or paying per token.

- `MimirNode` + Ollama runs locally in CI
- The test suite uses `OllamaClient` with `mimir.fetchFor(model)` — same code that runs in production
- Swap the libp2p config for a loopback-only config; no network access needed

## 7. Edge inference gateway

An IoT gateway aggregates inference requests from constrained devices on a local network and routes them to a more capable node.

- Constrained devices dial the gateway via TCP
- The gateway runs `MimirClient`, discovers capable nodes via DHT, and tunnels requests through
- Devices need no libp2p stack — they speak plain HTTP to the gateway
