import { describe, it, expect } from 'bun:test'
import OpenAI from 'openai'
import { OllamaClient } from './ollama'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeChunk(content: string, finishReason: string | null = null) {
    return {
        id: 'chatcmpl-test',
        object: 'chat.completion.chunk',
        created: 0,
        model: 'llama3.2:latest',
        choices: [{ index: 0, delta: { content }, finish_reason: finishReason }],
    }
}

/** Build a mock fetch that streams SSE chunks */
function sseFetch(chunks: object[]): typeof fetch {
    const encoder = new TextEncoder()
    return () => {
        const body = new ReadableStream({
            start(controller) {
                for (const chunk of chunks) {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`))
                }
                controller.enqueue(encoder.encode('data: [DONE]\n\n'))
                controller.close()
            },
        })
        return Promise.resolve(
            new Response(body, {
                status: 200,
                headers: { 'Content-Type': 'text/event-stream' },
            })
        )
    }
}

/** Build a mock fetch that returns a JSON response */
function jsonFetch(payload: object): typeof fetch {
    return () =>
        Promise.resolve(
            new Response(JSON.stringify(payload), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            })
        )
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('OllamaClient', () => {
    it('extends OpenAI', () => {
        const client = new OllamaClient()
        expect(client).toBeInstanceOf(OpenAI)
    })

    it('uses default base URL', () => {
        const client = new OllamaClient()
        expect(client.baseURL).toBe('http://localhost:11434/v1')
    })

    it('accepts a custom base URL', () => {
        const client = new OllamaClient('http://myhost:11434/v1')
        expect(client.baseURL).toBe('http://myhost:11434/v1')
    })

    it('streams chat completions', async () => {
        const chunks = [
            makeChunk('Hello'),
            makeChunk(', world'),
            makeChunk('!', 'stop'),
        ]

        const client = new OllamaClient('http://localhost:11434/v1', null, sseFetch(chunks))
        const stream = await client.chat.completions.create({
            model: 'llama3.2:latest',
            messages: [{ role: 'user', content: 'Hi' }],
            stream: true,
        })

        const received: string[] = []
        for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content
            if (content) received.push(content)
        }

        expect(received).toEqual(['Hello', ', world', '!'])
    })

    it('collects a non-streaming completion', async () => {
        const response = {
            id: 'chatcmpl-1',
            object: 'chat.completion',
            created: 0,
            model: 'llama3.2:latest',
            choices: [{
                index: 0,
                message: { role: 'assistant', content: 'Hi there!' },
                finish_reason: 'stop',
            }],
            usage: { prompt_tokens: 1, completion_tokens: 2, total_tokens: 3 },
        }

        const client = new OllamaClient('http://localhost:11434/v1', null, jsonFetch(response))
        const result = await client.chat.completions.create({
            model: 'llama3.2:latest',
            messages: [{ role: 'user', content: 'Hey' }],
            stream: false,
        })

        expect(result.choices[0].message.content).toBe('Hi there!')
    })
})
