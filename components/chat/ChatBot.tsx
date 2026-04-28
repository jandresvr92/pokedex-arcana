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
  es: '¡Hola! Soy tu asistente Pokédex Arcana. Pronto podré responder preguntas complejas sobre el universo Pokémon — desde estadísticas de batalla hasta lore y composición de equipos.',
  en: "Hello! I'm your Pokédex Arcana assistant. Soon I'll be able to answer complex questions about the Pokémon universe — from battle stats to lore and team composition.",
};
const PLACEHOLDER = {
  es: '¿Cuáles son las debilidades de Charizard?',
  en: "What are Charizard's weaknesses?",
};
const COMING_SOON = {
  es: '🚧 El sistema multi-agente está en desarrollo. ¡Vuelve pronto!',
  en: '🚧 The multi-agent system is under development. Check back soon!',
};

export function ChatBot({ locale }: ChatBotProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: 0, role: 'assistant', text: WELCOME[locale] },
  ]);
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  const sendMessage = () => {
    const text = input.trim();
    if (!text) return;
    const uid = Date.now();
    setMessages((m) => [
      ...m,
      { id: uid, role: 'user', text },
      { id: uid + 1, role: 'assistant', text: COMING_SOON[locale] },
    ]);
    setInput('');
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
                {locale === 'es' ? 'Multi-agente · En desarrollo' : 'Multi-agent · In development'}
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
              disabled={!input.trim()}
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
