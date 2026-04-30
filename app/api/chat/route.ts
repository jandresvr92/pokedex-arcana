import { NextRequest, NextResponse } from 'next/server';
import { classifyIntent } from '@/lib/chat/orchestrator';
import { runExecutor } from '@/lib/chat/executor';
import { addHistory, getSession, mergeSession } from '@/lib/chat/memory';

export async function POST(req: NextRequest) {
  let body: { sessionId?: string; locale?: 'en' | 'es'; message?: string } | null = null;

  try {
    body = (await req.json()) as typeof body;
    if (process.env.DEBUG) console.log('Chat request body:', body);
  } catch {
    return NextResponse.json({ type: 'text', content: 'Invalid request.' }, { status: 400 });
  }

  const sessionId = typeof body?.sessionId === 'string' ? body.sessionId.trim() : '';
  const locale = body?.locale === 'es' || body?.locale === 'en' ? body.locale : 'en';
  const message = typeof body?.message === 'string' ? body.message.trim() : '';

  if (!sessionId || !message) {
    const content = locale === 'es' ? 'Solicitud invalida.' : 'Invalid request.';
    if (process.env.DEBUG) console.log('Invalid request - missing sessionId or message', { sessionId, message });
    return NextResponse.json({ type: 'text', content }, { status: 400 });
  }

  const session = getSession(sessionId);
  addHistory(sessionId, 'user', message);

  try {
    if (process.env.DEBUG) console.log('Processing chat:', { sessionId, locale, message });
    const mode = await classifyIntent(message);
    if (process.env.DEBUG) console.log('Intent classified:', mode);
    const result = await runExecutor({ mode, message, locale, memory: session });
    if (process.env.DEBUG) console.log('Executor result:', { memoryUpdate: result.memoryUpdate, truncatedContent: String(result.content).slice(0, 1000) });
    if (result.memoryUpdate) mergeSession(sessionId, result.memoryUpdate);
    addHistory(sessionId, 'assistant', result.content);

    return NextResponse.json({ type: 'text', content: result.content });
  } catch (err) {
    console.error('Chat error:', err);
    const content = locale === 'es'
      ? 'Ocurrio un error al procesar tu solicitud.'
      : 'An error occurred while processing your request.';
    return NextResponse.json({ type: 'text', content }, { status: 500 });
  }
}
