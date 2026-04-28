import { llmChat } from './llm';

export type Intent = 'INFO' | 'BATTLE' | 'COUNTERS' | 'TEAM' | 'REPORT';

const KEYWORDS = {
  team: ['equipo', 'team', 'composicion', 'sinergia', 'cobertura', 'ou'],
  battle: ['vs', 'versus', 'pelea', 'batalla', 'gana', 'ganaria'],
  counters: ['counter', 'counters', 'le gana', 'fuerte contra', 'debil contra', 'weak', 'strong'],
  report: ['reporte', 'report', 'informe'],
  info: ['tipo', 'stats', 'estadisticas', 'habilidad', 'habilidades', 'evolucion', 'evolution', 'historia', 'lore', 'dano', 'damage', 'calculo'],
};

function containsAny(text: string, keywords: string[]): boolean {
  return keywords.some((k) => text.includes(k));
}

export async function classifyIntent(message: string): Promise<Intent> {
  const text = message.toLowerCase();

  if (containsAny(text, KEYWORDS.team)) return 'TEAM';
  if (containsAny(text, KEYWORDS.counters)) return 'COUNTERS';
  if (containsAny(text, KEYWORDS.battle)) return 'BATTLE';
  if (containsAny(text, KEYWORDS.report)) return 'REPORT';
  if (containsAny(text, KEYWORDS.info)) return 'INFO';

  return classifyWithLLM(message);
}

async function classifyWithLLM(message: string): Promise<Intent> {
  const content = await llmChat(
    [
      {
        role: 'system',
        content:
          'Classify the user intent. Reply with a single token: INFO, BATTLE, COUNTERS, TEAM, or REPORT.',
      },
      { role: 'user', content: message },
    ],
    { temperature: 0 }
  );

  const normalized = content.trim().toUpperCase();
  if (normalized.includes('TEAM')) return 'TEAM';
  if (normalized.includes('COUNTERS')) return 'COUNTERS';
  if (normalized.includes('BATTLE')) return 'BATTLE';
  if (normalized.includes('REPORT')) return 'REPORT';
  return 'INFO';
}
