export interface LlmMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

const OPENROUTER_URL = process.env.OPENROUTER_URL ?? 'https://openrouter.ai/api/v1/chat/completions';
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL ?? 'meta-llama/llama-3.1-8b-instruct:free';
const OPENROUTER_TIMEOUT_MS = Number(process.env.OPENROUTER_TIMEOUT_MS ?? '90000');
const OPENROUTER_SITE_URL = process.env.OPENROUTER_SITE_URL;
const OPENROUTER_APP_NAME = process.env.OPENROUTER_APP_NAME;

export async function llmChat(
  messages: LlmMessage[],
  options?: { temperature?: number }
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('Missing OPENROUTER_API_KEY');

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), OPENROUTER_TIMEOUT_MS);

  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  };

  if (OPENROUTER_SITE_URL) headers['HTTP-Referer'] = OPENROUTER_SITE_URL;
  if (OPENROUTER_APP_NAME) headers['X-Title'] = OPENROUTER_APP_NAME;

  let res: Response;
  try {
    res = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        messages,
        stream: false,
        temperature: options?.temperature ?? 0.2,
      }),
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timeoutId);
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('OpenRouter timeout');
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }

  if (!res.ok) {
    const errorText = await res.text();
    let detail = errorText;
    try {
      const parsed = JSON.parse(errorText) as { error?: { message?: string } };
      if (parsed?.error?.message) detail = parsed.error.message;
    } catch {
      // keep raw text
    }
    throw new Error(`OpenRouter error: ${res.status} ${detail}`.trim());
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error('OpenRouter returned empty content');
  return content;
}
