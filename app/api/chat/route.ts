import { NextRequest, NextResponse } from 'next/server';
import { MasterOrchestrator } from '@/lib/chat/agents';
import { addHistory, getSession, mergeSession } from '@/lib/chat/memory';

// Instancia única del Master Orchestrator
const masterOrchestrator = new MasterOrchestrator();

export async function POST(req: NextRequest) {
  let body: unknown = null;

  try {
    body = await req.json();
    if (process.env.DEBUG) console.log('Chat request body:', body);
  } catch {
    return NextResponse.json({ type: 'text', content: 'Invalid request.' }, { status: 400 });
  }

  if (!body || typeof body !== 'object') {
    return NextResponse.json({ type: 'text', content: 'Invalid request.' }, { status: 400 });
  }

  const bodyObj = body as Record<string, unknown>;
  const sessionId = typeof bodyObj.sessionId === 'string' ? bodyObj.sessionId.trim() : '';
  const localeValue = bodyObj.locale === 'es' ? 'es' : bodyObj.locale === 'en' ? 'en' : 'en';
  const locale: 'en' | 'es' = localeValue;
  const message = typeof bodyObj.message === 'string' ? bodyObj.message.trim() : '';

  if (!sessionId || !message) {
    const content = locale === 'es' ? 'Solicitud invalida.' : 'Invalid request.';
    if (process.env.DEBUG) console.log('Invalid request - missing sessionId or message', { sessionId, message });
    return NextResponse.json({ type: 'text', content }, { status: 400 });
  }

  const session = getSession(sessionId);
  addHistory(sessionId, 'user', message);

  try {
    if (process.env.DEBUG) console.log('Processing chat:', { sessionId, locale, message });
    
    // Delega al Master Orchestrator multi-agente
    const result = await masterOrchestrator.execute({
      message,
      locale,
      memory: session,
    });

    if (process.env.DEBUG) {
      console.log('Orchestrator result:', {
        memoryUpdate: (result as any).memoryUpdate,
        truncatedContent: String(result.content).slice(0, 1000),
      });
    }

    // Actualiza memoria de sesión
    if ((result as any).memoryUpdate) {
      mergeSession(sessionId, (result as any).memoryUpdate);
    }
    
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
