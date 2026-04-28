export interface OllamaMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

const OLLAMA_URL = process.env.OLLAMA_URL ?? 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? 'qwen2';
const OLLAMA_TIMEOUT_MS = Number(process.env.OLLAMA_TIMEOUT_MS ?? '30000');

export async function ollamaChat(
  messages: OllamaMessage[],
  options?: { temperature?: number }
): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), OLLAMA_TIMEOUT_MS);

  const res = await fetch(`${OLLAMA_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      messages,
      stream: false,
      temperature: options?.temperature ?? 0.2,
    }),
    signal: controller.signal,
  }).finally(() => clearTimeout(timeoutId));

  if (!res.ok) throw new Error(`Ollama error: ${res.status}`);
  const data = (await res.json()) as { message?: { content?: string } };
  const content = data?.message?.content;
  if (!content) throw new Error('Ollama returned empty content');
  return content;
}
