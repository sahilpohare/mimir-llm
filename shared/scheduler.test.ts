import { describe, it, expect, beforeEach } from 'bun:test'
import { PeerScheduler } from './scheduler'
import type { PeerId } from '@libp2p/interface'

function makePeerId(id: string): PeerId {
    return { toString: () => id, equals: (other: PeerId) => other.toString() === id } as PeerId
}

describe('PeerScheduler', () => {
    let sched: PeerScheduler

    beforeEach(() => {
        sched = new PeerScheduler()
    })

    it('returns null when no candidates', () => {
        expect(sched.pick([])).toBeNull()
    })

    it('returns the only candidate', () => {
        const p = makePeerId('peer-a')
        sched.register(p)
        expect(sched.pick([p])?.toString()).toBe('peer-a')
    })

    it('prefers peer with fewer active requests', () => {
        const a = makePeerId('peer-a')
        const b = makePeerId('peer-b')
        sched.register(a)
        sched.register(b)

        // put peer-a in flight
        sched.begin(a)

        expect(sched.pick([a, b])?.toString()).toBe('peer-b')
    })

    it('decrements activeRequests after done()', () => {
        const p = makePeerId('peer-a')
        const done = sched.begin(p)
        expect(sched.snapshot().get('peer-a')!.activeRequests).toBe(1)
        done(100)
        expect(sched.snapshot().get('peer-a')!.activeRequests).toBe(0)
    })

    it('updates EWMA on done()', () => {
        const p = makePeerId('peer-a')
        const done = sched.begin(p)
        // initial EWMA = 500, alpha = 0.2, sample = 100
        // new EWMA = 0.8 * 500 + 0.2 * 100 = 420
        done(100)
        const stats = sched.snapshot().get('peer-a')!
        expect(stats.ewmaLatencyMs).toBeCloseTo(420)
    })

    it('activeRequests never goes below 0', () => {
        const p = makePeerId('peer-a')
        const done = sched.begin(p)
        done(50)
        done(50) // extra done() call
        expect(sched.snapshot().get('peer-a')!.activeRequests).toBe(0)
    })

    it('remove clears the peer', () => {
        const p = makePeerId('peer-a')
        sched.register(p)
        sched.remove(p)
        expect(sched.snapshot().has('peer-a')).toBe(false)
    })

    it('snapshot is a copy, not a reference', () => {
        const p = makePeerId('peer-a')
        sched.register(p)
        const snap = sched.snapshot()
        sched.begin(p)
        // snapshot should still show 0 active requests
        expect(snap.get('peer-a')!.activeRequests).toBe(0)
    })

    it('picks lowest-score peer across many', () => {
        const peers = ['a', 'b', 'c', 'd'].map(makePeerId)
        peers.forEach((p) => sched.register(p))
        // saturate a, b, c
        sched.begin(peers[0])
        sched.begin(peers[1])
        sched.begin(peers[1])
        sched.begin(peers[2])
        // d has 0 in-flight — should win
        expect(sched.pick(peers)?.toString()).toBe('d')
    })
})
