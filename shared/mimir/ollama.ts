import OpenAI from 'openai'

export class OllamaClient extends OpenAI {
    constructor(
        private _baseUrl: string = 'http://localhost:11434/v1'
    ) {
        super({
            baseURL: _baseUrl,
            apiKey: 'fakeapikey'
        });
    }
}