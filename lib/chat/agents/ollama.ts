import { ChatOpenAI } from '@langchain/openai';

// Fallback to the exact string in case process.env is not fully populated at module load time
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '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';
const OPENROUTER_MODEL = 'openrouter/free';

export const chatModel = new ChatOpenAI({
  modelName: OPENROUTER_MODEL,
  temperature: 0.2,
  apiKey: OPENROUTER_API_KEY,
  configuration: {
    baseURL: 'https://openrouter.ai/api/v1',
    defaultHeaders: {
      'HTTP-Referer': 'http://localhost:3000',
      'X-Title': 'Pokedex Arcana'
    }
  }
});
