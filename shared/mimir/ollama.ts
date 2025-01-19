import OpenAI from 'openai'

export class OllamaClient extends OpenAI {
    constructor(
        private _baseUrl: string = 'http://localhost:11434/v1',
        private _apiKey: string = null
    ) {
        super({
            baseURL: _baseUrl,
            apiKey: _apiKey
        });
    }
}