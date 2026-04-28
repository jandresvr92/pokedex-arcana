'use client';

import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface ChatBotProps {
  locale: 'en' | 'es';
}

interface Message {
  id: number;
  role: 'assistant' | 'user';
  text: string;
}

const WELCOME = {
  es: '¡Hola! Soy tu asistente Pokédex Arcana. Pregúntame sobre stats, tipos, counters, equipos o lore.',
  en: "Hello! I'm your Pokédex Arcana assistant. Ask me about stats, types, counters, teams, or lore.",
};
const PLACEHOLDER = {
  es: '¿Cuáles son las debilidades de Charizard?',
  en: "What are Charizard's weaknesses?",
};
const TYPING = {
  es: 'Pensando...',
  en: 'Thinking...',
};
const ERROR_MESSAGE = {
  es: 'Ocurrio un error. Intentalo de nuevo.',
  en: 'An error occurred. Please try again.',
};
const STORAGE_KEY = 'pokedex-arcana-session';

export function ChatBot({ locale }: ChatBotProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: 0, role: 'assistant', text: WELCOME[locale] },
  ]);
  const [input, setInput] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setSessionId(stored);
      return;
    }
    const id = crypto.randomUUID();
    window.localStorage.setItem(STORAGE_KEY, id);
    setSessionId(id);
  }, []);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || !sessionId || sending) return;
    const uid = Date.now();
    const assistantId = uid + 1;
    setMessages((m) => [
      ...m,
      { id: uid, role: 'user', text },
      { id: assistantId, role: 'assistant', text: TYPING[locale] },
    ]);
    setInput('');
    setSending(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, locale, message: text }),
      });
      const data = (await res.json()) as { content?: string };
      const reply = data?.content?.trim() ? data.content : ERROR_MESSAGE[locale];
      setMessages((m) =>
        m.map((msg) => (msg.id === assistantId ? { ...msg, text: reply } : msg))
      );
    } catch {
      setMessages((m) =>
        m.map((msg) => (msg.id === assistantId ? { ...msg, text: ERROR_MESSAGE[locale] } : msg))
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      {/* Chat panel */}
      {open && (
        <div
          className={cn(
            'fixed bottom-20 right-4 z-50',
            'w-80 sm:w-96 max-h-[70vh] flex flex-col',
            'neo rounded-2xl overflow-hidden',
            'animate-slide-in'
          )}
        >
          {/* Header */}
          <div className="px-4 py-3 border-b border-arc-border flex items-center justify-between bg-arc-card">
            <div>
              <p className="font-display font-semibold text-arc-text">
                {locale === 'es' ? 'Pokédex IA' : 'Pokédex AI'}
              </p>
              <p className="font-mono text-[10px] text-arc-muted">
                {locale === 'es' ? 'Multi-agente · Activo' : 'Multi-agent · Active'}
              </p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-arc-muted hover:text-arc-text text-lg leading-none"
            >
              ✕
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-arc-bg">
            {messages.map((m) => (
              <div
                key={m.id}
                className={cn(
                  'max-w-[85%] px-3 py-2 rounded-xl text-sm font-body leading-relaxed',
                  m.role === 'assistant'
                    ? 'neo-sm self-start bg-arc-card text-arc-text'
                    : 'ml-auto neo-sm bg-arc-accent/10 text-arc-text'
                )}
              >
                {m.text}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-arc-border bg-arc-card flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') sendMessage(); }}
              placeholder={PLACEHOLDER[locale]}
              className="flex-1 neo-inset rounded-lg px-3 py-2 text-sm bg-transparent outline-none font-body placeholder:text-arc-muted/60"
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || sending || !sessionId}
              className={cn(
                'neo-sm rounded-lg px-3 py-2 text-sm font-body',
                'transition-all active:shadow-[inset_2px_2px_5px_#C4C0BA,inset_-2px_-2px_5px_#FFFFFF]',
                'disabled:opacity-40'
              )}
            >
              {locale === 'es' ? 'Enviar' : 'Send'}
            </button>
          </div>
        </div>
      )}

      {/* FAB */}
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'fixed bottom-4 right-4 z-50',
          'w-14 h-14 neo rounded-full',
          'flex items-center justify-center text-2xl',
          'transition-all duration-200 hover:shadow-none',
          'active:shadow-[inset_3px_3px_7px_#C4C0BA,inset_-3px_-3px_7px_#FFFFFF]'
        )}
        aria-label={locale === 'es' ? 'Abrir chat' : 'Open chat'}
      >
        {open ? '✕' : '🤖'}
      </button>
    </>
  );
}
