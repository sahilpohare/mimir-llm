import { createLibp2p } from 'libp2p'
import libp2pConfig from '../../shared/libp2p'
import { MimirClient } from '../../shared/mimir'
import { OllamaClient } from '../../shared/mimir/ollama'
import { createInterface } from 'readline'

async function prompt(question: string): Promise<string> {
    return new Promise((resolve) => {
        const rl = createInterface({ input: process.stdin, output: process.stdout })
        rl.question(question, (answer) => { rl.close(); resolve(answer) })
    })
}

async function main() {
    const libp2p = await createLibp2p(libp2pConfig)
    const mimir = new MimirClient(libp2p)
    await mimir.start()

    const model = 'llama3.2:latest'
    const openai = new OllamaClient('http://ignored/v1', null, mimir.fetchFor(model))

    while (true) {
        const message = await prompt('Enter message: ')
        if (message === 'exit') break

        const stream = await openai.chat.completions.create({
            model,
            stream: true,
            messages: [
                { role: 'system', content: 'You are a helpful assistant' },
                { role: 'user', content: message },
            ],
        })

        process.stdout.write('\n')
        for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content
            if (content) process.stdout.write(content)
        }
        process.stdout.write('\n')
    }
}

main().catch(console.error)
