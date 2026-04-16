# Roadmap

## Now — proof of concept

- [x] TCP transport via libp2p
- [x] mDNS peer discovery (LAN)
- [x] Kademlia DHT peer discovery (WAN)
- [x] Per-model protocol registration (`/mimir/<model>/1.0.0`)
- [x] Capability probing via `dialProtocol`
- [x] Raw HTTP tunnel through libp2p streams
- [x] OpenAI SDK compatibility via custom `fetchFn`
- [x] Peer scheduler (EWMA latency + active request count)
- [x] CID-based model advertisement

---

## Near term

### Reliability
- [ ] Retry with fallback peer when a stream fails mid-response
- [ ] Health check: periodic probe to evict stale peers from the scheduler
- [ ] Graceful degradation when no peers are available (queue with timeout)

### Observability
- [ ] Structured logging (per-request peer, latency, model, token count)
- [ ] Prometheus metrics endpoint (request rate, error rate, peer count, EWMA per peer)
- [ ] `MimirClient.stats()` — expose scheduler snapshot to application code

### Usability
- [ ] `bun start:node` / `bun start:client` with sane defaults and env var documentation
- [ ] Auto-reload model list when Ollama adds or removes a model (poll `/api/tags`)
- [ ] CLI tool: `mimir peers`, `mimir models`, `mimir status`

---

## Medium term

### Security
- [ ] Peer allowlist / denylist (by PeerId)
- [ ] Request signing — client signs each request so the node can verify identity
- [ ] Rate limiting per peer

### Transport
- [ ] WebRTC transport for browser clients
- [ ] QUIC transport for lower latency on WAN
- [ ] Relay support (circuit relay v2) for peers behind NAT

### Routing
- [ ] Multi-hop routing: client → relay → GPU node (for NAT traversal without hole-punching)
- [ ] Model aliasing: route `gpt-4` → best available local equivalent
- [ ] Capability matching: route by quantisation level, context length, or VRAM available

---

## Long term

### Incentives
- [ ] Node reputation score (latency, uptime, response quality)
- [ ] Token-based payment channel for node operators
- [ ] Slashing / dispute resolution for bad actors

### Federation
- [ ] Federated model registry: nodes publish model metadata (quantisation, context length, benchmarks)
- [ ] Cross-cluster peering: connect multiple private Mimir clusters via a public DHT bridge
- [ ] Model versioning: CID per model version, not just per model name

### Ecosystem
- [ ] OpenAI-compatible HTTP gateway so any tool works without modification
- [ ] LangChain / LlamaIndex integration
- [ ] VS Code extension with built-in `MimirClient`
