import { PeerId } from '@libp2p/interface'

// ---------------------------------------------------------------------------
// Per-peer stats tracked by the scheduler
// ---------------------------------------------------------------------------

export interface PeerStats {
    /** Exponentially weighted moving average of round-trip latency in ms */
    ewmaLatencyMs: number
    /** Number of requests currently in flight to this peer */
    activeRequests: number
    /** Total requests ever sent (used to bootstrap EWMA) */
    totalRequests: number
}

// Score formula: lower is better.
// Penalise active load linearly, latency logarithmically so a 2× latency
// difference matters less than an extra in-flight request.
function score(stats: PeerStats): number {
    const latencyScore = stats.ewmaLatencyMs === 0 ? 0 : Math.log1p(stats.ewmaLatencyMs)
    const loadScore = stats.activeRequests * 100
    return latencyScore + loadScore
}

const EWMA_ALPHA = 0.2          // weight for newest sample (0 < α < 1)
const INITIAL_LATENCY_MS = 500  // optimistic default before any measurement

// ---------------------------------------------------------------------------
// PeerScheduler
// ---------------------------------------------------------------------------

export class PeerScheduler {
    private readonly stats: Map<string, PeerStats> = new Map()

    private key(peerId: PeerId): string {
        return peerId.toString()
    }

    private getOrInit(peerId: PeerId): PeerStats {
        const k = this.key(peerId)
        if (!this.stats.has(k)) {
            this.stats.set(k, { ewmaLatencyMs: INITIAL_LATENCY_MS, activeRequests: 0, totalRequests: 0 })
        }
        return this.stats.get(k)!
    }

    /** Register a peer (no-op if already known). */
    register(peerId: PeerId): void {
        this.getOrInit(peerId)
    }

    /** Remove a peer (e.g. on disconnect). */
    remove(peerId: PeerId): void {
        this.stats.delete(this.key(peerId))
    }

    /**
     * Pick the best peer from the candidates for a given CID.
     * Returns null if the set is empty.
     */
    pick(candidates: Iterable<PeerId>): PeerId | null {
        let best: PeerId | null = null
        let bestScore = Infinity

        for (const peerId of Array.from(candidates)) {
            const s = score(this.getOrInit(peerId))
            if (s < bestScore) {
                bestScore = s
                best = peerId
            }
        }

        return best
    }

    /**
     * Call before dispatching a request to a peer.
     * Returns a done() callback — call it with the elapsed ms when the
     * request completes (or errors).
     */
    begin(peerId: PeerId): (elapsedMs: number) => void {
        const stats = this.getOrInit(peerId)
        stats.activeRequests++
        stats.totalRequests++

        return (elapsedMs: number) => {
            stats.activeRequests = Math.max(0, stats.activeRequests - 1)
            // Update EWMA: blend new sample in
            stats.ewmaLatencyMs =
                (1 - EWMA_ALPHA) * stats.ewmaLatencyMs + EWMA_ALPHA * elapsedMs
        }
    }

    /** Read-only snapshot of all peer stats (for debugging / metrics). */
    snapshot(): Map<string, Readonly<PeerStats>> {
        return new Map(Array.from(this.stats.entries()).map(([k, v]) => [k, { ...v }]))
    }
}
