import type { SessionData } from './memory';
import type { Intent } from './orchestrator';
import { llmChat } from './llm';
import {
  comparePokemons,
  estimateMoveDamage,
  getBestCounters,
  getEvolutionChain,
  getPokemon,
  getPokemonEncounters,
  getStrongestByType,
  suggestTeammates,
  getTypeEffectiveness,
} from './tools';

const TOOL_LIMIT = 6;

const toolRegistry = {
  getPokemon,
  getEvolutionChain,
  getTypeEffectiveness,
  comparePokemons,
  getBestCounters,
  getStrongestByType,
  getPokemonEncounters,
  estimateMoveDamage,
  suggestTeammates,
};

type ToolName = keyof typeof toolRegistry;

type ToolAction = {
  tool: ToolName;
  args: Record<string, unknown> | string;
};

type PlannerResult = {
  actions?: ToolAction[];
  teamUpdate?: string[];
  lastEntities?: string[];
};

type ExecutorInput = {
  mode: Intent;
  message: string;
  locale: 'en' | 'es';
  memory: SessionData;
};

export async function runExecutor({ mode, message, locale, memory }: ExecutorInput): Promise<{
  content: string;
  memoryUpdate?: { team?: string[]; lastEntities?: string[] };
}> {
  const plan = buildDeterministicPlan({ mode, message, memory })
    ?? await getPlan({ mode, message, locale, memory });
  if (process.env.DEBUG) console.log('Executor plan:', plan);
  const actions = Array.isArray(plan.actions) ? plan.actions.slice(0, TOOL_LIMIT) : [];

  const toolResults = [] as Array<{ tool: ToolName; args: Record<string, unknown>; result: unknown }>;
  for (const action of actions) {
    const tool = toolRegistry[action.tool];
    if (!tool) continue;
    const args = normalizeArgs(action.tool, action.args, locale);
    if (process.env.DEBUG) console.log('Calling tool:', action.tool, 'with args:', args);
    if (!isValidArgs(action.tool, args)) {
      toolResults.push({ tool: action.tool, args, result: { error: 'invalid_args' } });
      continue;
    }
    try {
      const result = await tool(args as never);
      if (process.env.DEBUG) console.log('Tool success:', action.tool, 'resultPreview:', (result && typeof result === 'object') ? JSON.stringify(result).slice(0,1000) : String(result));
      toolResults.push({ tool: action.tool, args, result });
    } catch (err) {
      if (process.env.DEBUG) console.log('Tool error:', action.tool, err);
      toolResults.push({ tool: action.tool, args, result: { error: 'tool_failed' } });
    }
  }

  if (process.env.DEBUG) console.log('Tool results summary:', toolResults.map(tr => ({ tool: tr.tool, args: tr.args, hasError: (tr.result && typeof tr.result === 'object' && 'error' in (tr.result as any)) || false })));

  const finalContent = await generateFinal({ mode, message, locale, memory, toolResults });

  const derivedEntities = deriveEntities(toolResults);
  const memoryUpdate = {
    team: plan.teamUpdate,
    lastEntities: plan.lastEntities?.length
      ? plan.lastEntities
      : derivedEntities.length
        ? derivedEntities
        : undefined,
  };

  return { content: finalContent, memoryUpdate };
}

const STOPWORDS = new Set([
  'a', 'al', 'de', 'del', 'la', 'las', 'el', 'los', 'un', 'una', 'unos', 'unas',
  'que', 'quien', 'quienes', 'como', 'cual', 'cuales', 'por', 'para', 'porque',
  'le', 'les', 'gana', 'ganar', 'vs', 'versus', 'contra', 'equipo', 'team',
  'pokemon', 'tipo', 'tipos', 'stats', 'estadisticas', 'habilidad', 'habilidades',
  'evolucion', 'evolution', 'historia', 'lore', 'mejor', 'mejores', 'mas',
  'fuerte', 'strongest', 'strong', 'type', 'dano', 'damage', 'calculo',
  'debil', 'debilidades', 'cubre', 'cubra', 'competitivo', 'competitiva', 'ou',
  'companero', 'companeros', 'amigo', 'amigos', 'rival', 'rivales', 'aparece',
  'donde', 'cuentame', 'cuentanos', 'por', 'que',
  // possessive and personal pronouns (spanish) to avoid picking them as names
  'su', 'sus', 'mi', 'mis', 'tu', 'tus', 'nuestro', 'nuestros', 'nuestra', 'nuestras', 'vuestro', 'vuestros', 'vuestra', 'vuestras',
]);

const TEAM_LIMIT = 4;

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\u00C0-\u017F\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeToken(token: string): string {
  return token.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function normalizeForParsing(text: string): string {
  return normalizeToken(normalizeText(text));
}

const TYPE_ALIASES: Record<string, string> = {
  normal: 'normal',
  fuego: 'fire',
  fire: 'fire',
  agua: 'water',
  water: 'water',
  planta: 'grass',
  grass: 'grass',
  electrico: 'electric',
  electric: 'electric',
  hielo: 'ice',
  ice: 'ice',
  lucha: 'fighting',
  fighting: 'fighting',
  veneno: 'poison',
  poison: 'poison',
  tierra: 'ground',
  ground: 'ground',
  volador: 'flying',
  flying: 'flying',
  psiquico: 'psychic',
  psychic: 'psychic',
  bicho: 'bug',
  bug: 'bug',
  roca: 'rock',
  rock: 'rock',
  fantasma: 'ghost',
  ghost: 'ghost',
  dragon: 'dragon',
  siniestro: 'dark',
  dark: 'dark',
  acero: 'steel',
  steel: 'steel',
  hada: 'fairy',
  fairy: 'fairy',
};

function extractTypeName(message: string): string | null {
  const tokens = normalizeText(message).split(' ').filter(Boolean);
  for (const token of tokens) {
    const normalized = normalizeToken(token);
    const mapped = TYPE_ALIASES[normalized];
    if (mapped) return mapped;
  }
  return null;
}

function pickLastToken(text: string): string | null {
  const tokens = normalizeText(text).split(' ').filter(Boolean);
  for (let i = tokens.length - 1; i >= 0; i -= 1) {
    const token = normalizeToken(tokens[i]);
    if (!STOPWORDS.has(token)) return token;
  }
  return null;
}

type StatKey = 'hp' | 'attack' | 'defense' | 'special-attack' | 'special-defense' | 'speed';

const MOVE_ALIASES: Record<string, string> = {
  ventisca: 'blizzard',
  'rayo hielo': 'ice beam',
  'rayo solar': 'solar beam',
  terremoto: 'earthquake',
  lanzallamas: 'flamethrower',
  hidrobomba: 'hydro pump',
  'bola sombra': 'shadow ball',
  rayo: 'thunderbolt',
  trueno: 'thunder',
  surf: 'surf',
};

function resolveMoveAlias(name: string): string {
  const cleaned = normalizeForParsing(name)
    .replace(/\b(el|la|los|las)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return MOVE_ALIASES[cleaned] ?? cleaned;
}

function parseStatKey(text: string): StatKey | null {
  const cleaned = normalizeForParsing(text);
  if (/\b(ps|hp|salud|vida)\b/.test(cleaned)) return 'hp';
  if (/\b(defensa|def)\b/.test(cleaned) && /\b(esp|especial)\b/.test(cleaned)) {
    return 'special-defense';
  }
  if (/\b(atq|ataque)\b/.test(cleaned) && /\b(esp|especial)\b/.test(cleaned)) {
    return 'special-attack';
  }
  if (/\b(atk|ataque|atq)\b/.test(cleaned)) return 'attack';
  if (/\b(spdef|sp\s*def)\b/.test(cleaned)) return 'special-defense';
  if (/\b(spatk|sp\s*atk)\b/.test(cleaned)) return 'special-attack';
  if (/\b(defensa|def)\b/.test(cleaned)) return 'defense';
  if (/\b(velocidad|speed|spe)\b/.test(cleaned)) return 'speed';
  return null;
}

function parseEvs(segment: string): Partial<Record<StatKey, number>> {
  const cleaned = normalizeForParsing(segment);
  const evs: Partial<Record<StatKey, number>> = {};
  const matches = cleaned.matchAll(/(\d+)\s*evs?\s+en\s+([a-z\s]+)/g);
  for (const match of matches) {
    const value = Number(match[1]);
    const statKey = parseStatKey(match[2]);
    if (statKey && Number.isFinite(value)) evs[statKey] = value;
  }
  return evs;
}

function parseDamageQuery(message: string, memory: SessionData) {
  const normalized = normalizeForParsing(message);
  if (!normalized.includes('dano') && !normalized.includes('damage') && !normalized.includes('cuanto')) return null;
  if (!normalized.includes('usa') || !normalized.includes('contra')) return null;

  const attackerMatch = normalized.match(/\bmi\s+([a-z0-9-]+)/) ??
    normalized.match(/\b([a-z0-9-]+)\s+de\s+naturaleza\b/) ??
    normalized.match(/\bde\s+([a-z0-9-]+)\s+usa/);
  const defenderMatch = normalized.match(/\bcontra\s+(?:un|una|al|a)?\s*([a-z0-9-]+)/);
  const moveMatch = normalized.match(/\busa\s+(.+?)(?:\s+contra\b|$)/);

  const attacker = attackerMatch?.[1] ?? memory.lastEntities[0];
  const defender = defenderMatch?.[1] ?? memory.lastEntities[1];
  const move = moveMatch?.[1] ? resolveMoveAlias(moveMatch[1]) : null;

  if (!attacker || !defender || !move) return null;

  const levelMatch = normalized.match(/\bnivel\s+(\d+)/) ?? normalized.match(/\blevel\s+(\d+)/);
  const natureMatch = normalized.match(/\bnaturaleza\s+([a-z]+)/) ?? normalized.match(/\bnature\s+([a-z]+)/);

  const beforeContra = normalized.split(/\bcontra\b/)[0] ?? normalized;
  const afterContra = normalized.split(/\bcontra\b/)[1] ?? '';

  const attackerEvs = parseEvs(beforeContra);
  const defenderEvs = parseEvs(afterContra);

  return {
    attacker,
    defender,
    move,
    level: levelMatch ? Number(levelMatch[1]) : undefined,
    nature: natureMatch?.[1],
    attackerEvs: Object.keys(attackerEvs).length ? attackerEvs : undefined,
    defenderEvs: Object.keys(defenderEvs).length ? defenderEvs : undefined,
  };
}

function extractBattleNames(message: string, memory: SessionData): { a: string; b: string } | null {
  const normalized = normalizeToken(normalizeText(message));
  const match = normalized.match(/\s(vs|versus|contra)\s/);
  if (!match || match.index === undefined) return null;

  const left = normalized.slice(0, match.index).trim();
  const right = normalized.slice(match.index + match[0].length).trim();
  const a = pickLastToken(left) ?? memory.lastEntities[0];
  const b = pickLastToken(right) ?? memory.lastEntities[1];
  if (!a || !b) return null;
  return { a, b };
}

function extractSingleName(message: string, memory: SessionData): string | null {
  // Prefer explicit constructs like "sobre Pikachu" or "de Pikachu"
  const sobreMatch = message.match(/\bsobre\s+([A-Za-z0-9À-ÖØ-öø-ÿ'-]+)\b/i);
  if (sobreMatch && sobreMatch[1]) return normalizeToken(sobreMatch[1]);

  const deMatch = message.match(/\bde\s+([A-Za-z0-9À-ÖØ-öø-ÿ'-]+)\b/i);
  if (deMatch && deMatch[1]) return normalizeToken(deMatch[1]);

  // Fallback to last meaningful token
  return pickLastToken(message) ?? memory.lastEntities[0] ?? null;
}

function extractTeam(message: string): string[] {
  if (!message.includes(',')) return [];
  const parts = message.split(',');
  const names = parts
    .map((part) => pickLastToken(part))
    .filter((name): name is string => Boolean(name));
  return names;
}

function buildDeterministicPlan({
  mode,
  message,
  memory,
}: {
  mode: Intent;
  message: string;
  memory: SessionData;
}): PlannerResult | null {
  const normalized = normalizeForParsing(message);
  const damageQuery = parseDamageQuery(message, memory);
  if (damageQuery) {
    return {
      actions: [{ tool: 'estimateMoveDamage', args: damageQuery }],
      lastEntities: [damageQuery.attacker, damageQuery.defender],
    };
  }
  const strongestType = extractTypeName(message);
  const wantsStrongest = normalized.includes('mas fuerte') || normalized.includes('strongest');
  if (wantsStrongest && strongestType) {
    return {
      actions: [{ tool: 'getStrongestByType', args: { type: strongestType, limit: 3 } }],
      lastEntities: [strongestType],
    };
  }

  if (mode === 'COUNTERS') {
    const target = extractSingleName(message, memory);
    if (!target) return null;
    return {
      actions: [{ tool: 'getBestCounters', args: { target, limit: 5 } }],
      lastEntities: [target],
    };
  }

  if (mode === 'BATTLE') {
    const damageQueryFallback = parseDamageQuery(message, memory);
    if (damageQueryFallback) {
      return {
        actions: [{ tool: 'estimateMoveDamage', args: damageQueryFallback }],
        lastEntities: [damageQueryFallback.attacker, damageQueryFallback.defender],
      };
    }
    const battle = extractBattleNames(message, memory);
    if (!battle) return null;
    return {
      actions: [{ tool: 'comparePokemons', args: { a: battle.a, b: battle.b } }],
      lastEntities: [battle.a, battle.b],
    };
  }

  if (mode === 'INFO') {
    const wantsEvolution = normalized.includes('evolucion') || normalized.includes('evolution');
    const wantsEncounters = normalized.includes('donde aparece') || normalized.includes('aparece')
      || normalized.includes('ubicacion') || normalized.includes('localizacion')
      || normalized.includes('encuentra');
    const wantsFriends = normalized.includes('amigo') || normalized.includes('amigos');
    const wantsRivals = normalized.includes('rival') || normalized.includes('rivales');
    const target = extractSingleName(message, memory);
    if (!target) return null;
    const actions: ToolAction[] = [{ tool: 'getPokemon', args: { name: target } }];
    if (wantsEvolution) actions.push({ tool: 'getEvolutionChain', args: { name: target } });
    if (wantsEncounters) actions.push({ tool: 'getPokemonEncounters', args: { name: target, limit: 8 } });
    if (wantsFriends) actions.push({ tool: 'suggestTeammates', args: { target, limit: 5 } });
    if (wantsRivals) actions.push({ tool: 'getBestCounters', args: { target, limit: 5 } });
    return {
      actions,
      lastEntities: [target],
    };
  }

  if (mode === 'TEAM' || mode === 'REPORT') {
    const team = extractTeam(message);
    const fallbackTeam = memory.team.slice(0, TEAM_LIMIT);
    const finalTeam = team.length ? team : fallbackTeam;
    if (finalTeam.length) {
      return {
        actions: finalTeam.slice(0, TEAM_LIMIT).map((name) => ({
          tool: 'getPokemon',
          args: { name },
        })),
        teamUpdate: team.length ? team : undefined,
        lastEntities: finalTeam,
      };
    }
    const target = extractSingleName(message, memory);
    if (!target) return null;
    return {
      actions: [{ tool: 'suggestTeammates', args: { target, limit: 5 } }],
      lastEntities: [target],
    };
  }

  return null;
}

async function getPlan({ mode, message, locale, memory }: ExecutorInput): Promise<PlannerResult> {
  const system =
    'You are the executor planner. Output ONLY valid JSON. ' +
    'Use tools when the answer depends on Pokemon data, stats, types, evolutions, or factual details. ' +
    'Available tools and schemas:\n' +
    '1) getPokemon({"name": string, "locale"?: "en"|"es"})\n' +
    '2) getEvolutionChain({"name": string})\n' +
    '3) getTypeEffectiveness({"attackerTypes": string[], "defenderTypes": string[]})\n' +
    '4) comparePokemons({"a": string, "b": string})\n' +
    '5) getBestCounters({"target": string, "limit"?: number})\n' +
    '6) getStrongestByType({"type": string, "limit"?: number, "maxCandidates"?: number})\n' +
    '7) getPokemonEncounters({"name": string, "limit"?: number})\n' +
    '8) estimateMoveDamage({"attacker": string, "defender": string, "move": string, "level"?: number, "nature"?: string, "attackerEvs"?: object, "defenderEvs"?: object})\n' +
    '9) suggestTeammates({"target": string, "limit"?: number, "maxCandidates"?: number})\n' +
    'Return JSON: {"actions": [{"tool": "...", "args": {...}}], "teamUpdate": [..], "lastEntities": [..]}. ' +
    'If no tools are needed, return {"actions": []}.';

  const user = JSON.stringify({
    mode,
    locale,
    message,
    memory: {
      history: memory.history,
      team: memory.team,
      lastEntities: memory.lastEntities,
    },
  });

  const raw = await llmChat(
    [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    { temperature: 0.2 }
  );

  return safeJsonParse(raw) ?? { actions: [] };
}

async function generateFinal({
  mode,
  message,
  locale,
  memory,
  toolResults,
}: {
  mode: Intent;
  message: string;
  locale: 'en' | 'es';
  memory: SessionData;
  toolResults: Array<{ tool: ToolName; args: Record<string, unknown>; result: unknown }>;
}): Promise<string> {
  const system =
    'You are the executor. Answer using ONLY the tool results provided. ' +
    'If data is missing, say so. Mention any assumptions from the tool results. ' +
    'Respond in the requested locale. ' +
    'Use Markdown only when mode is REPORT. Do not output JSON.';

  const user = JSON.stringify({
    mode,
    locale,
    message,
    memory: {
      history: memory.history,
      team: memory.team,
      lastEntities: memory.lastEntities,
    },
    toolResults,
  });

  // If no real LLM is configured, produce a tool-only summary locally to avoid generic mock text.
  const apiKey = process.env.OPENROUTER_API_KEY;
  const isPlaceholderKey = typeof apiKey === 'string' && apiKey.includes('REPLACE_WITH');
  const mockMode = !apiKey || isPlaceholderKey || process.env.MOCK_LLM === 'true' || process.env.DEBUG === 'true';
  if (mockMode) {
    return summarizeToolResults(toolResults, locale, mode);
  }

  const content = await llmChat(
    [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    { temperature: 0.3 }
  );

  return content.trim();
}

function summarizeToolResults(
  toolResults: Array<{ tool: ToolName; args: Record<string, unknown>; result: unknown }>,
  locale: 'en' | 'es',
  mode: Intent
): string {
  const spanish = locale === 'es';
  const lines: string[] = [];
  if (spanish) lines.push('Resumen generado sin LLM — usando solo herramientas.');
  else lines.push('Tool-only summary (no LLM configured).');

  for (const entry of toolResults) {
    const { tool, result } = entry;
    if (!result || typeof result !== 'object') continue;
    // getPokemon
    if (tool === 'getPokemon') {
      const r = result as any;
      if (spanish) {
        lines.push(`- ${r.name}: tipos ${Array.isArray(r.types) ? r.types.join(', ') : ''}. HP: ${r.stats?.find((s: any) => s.name === 'hp')?.value ?? '?'}.`);
      } else {
        lines.push(`- ${r.name}: types ${Array.isArray(r.types) ? r.types.join(', ') : ''}. HP: ${r.stats?.find((s: any) => s.name === 'hp')?.value ?? '?'}.`);
      }
      continue;
    }

    if (tool === 'getPokemonEncounters') {
      const r = result as any;
      if (Array.isArray(r.locations) && r.locations.length) {
        lines.push((spanish ? '- Apariciones:' : '- Encounters:') + ` ${r.locations.slice(0, 8).join(', ')}`);
      }
      continue;
    }

    if (tool === 'suggestTeammates') {
      const r = result as any;
      if (Array.isArray(r.teammates)) {
        const names = r.teammates.map((t: any) => t.name).slice(0, 5).join(', ');
        lines.push((spanish ? '- Compañeros sugeridos:' : '- Suggested teammates:') + ` ${names}`);
      }
      continue;
    }

    if (tool === 'getBestCounters') {
      const r = result as any;
      if (Array.isArray(r.counters)) {
        const names = r.counters.map((c: any) => c.name).slice(0, 5).join(', ');
        lines.push((spanish ? '- Contadores recomendados:' : '- Recommended counters:') + ` ${names}`);
      }
      continue;
    }

    if (tool === 'estimateMoveDamage') {
      const r = result as any;
      if (r.error) {
        lines.push((spanish ? '- Cálculo de daño: error' : '- Damage estimate: error') + ` (${r.error})`);
      } else if (r.damageRange) {
        const min = r.damageRange.min; const max = r.damageRange.max;
        const pctMin = Math.round((r.percentRange?.min ?? 0) * 10) / 10;
        const pctMax = Math.round((r.percentRange?.max ?? 0) * 10) / 10;
        lines.push((spanish ? '- Estimación de daño:' : '- Damage estimate:') + ` ${min}–${max} (${pctMin}%–${pctMax}% del HP)`);
      }
      continue;
    }

    if (tool === 'comparePokemons') {
      const r = result as any;
      if (r.a && r.b) {
        lines.push((spanish ? `- Comparación: ${r.a.name} vs ${r.b.name}` : `- Comparison: ${r.a.name} vs ${r.b.name}`));
      }
      continue;
    }

    if (tool === 'getStrongestByType') {
      const r = result as any;
      if (Array.isArray(r.strongest)) {
        const names = r.strongest.map((s: any) => s.name).join(', ');
        lines.push((spanish ? '- Más fuertes por tipo:' : '- Strongest by type:') + ` ${names}`);
      }
      continue;
    }
  }

  return lines.join('\n');
}

function safeJsonParse(text: string): PlannerResult | null {
  try {
    return JSON.parse(text) as PlannerResult;
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]) as PlannerResult;
    } catch {
      return null;
    }
  }
}

function normalizeArgs(
  tool: ToolName,
  args: Record<string, unknown> | string,
  locale: 'en' | 'es'
): Record<string, unknown> {
  if (typeof args === 'string') {
    if (tool === 'getPokemon') return { name: args, locale };
    if (tool === 'getStrongestByType') return { type: args };
    if (tool === 'getPokemonEncounters') return { name: args };
    if (tool === 'suggestTeammates') return { target: args };
    if (tool === 'estimateMoveDamage') return { attacker: args };
    return { name: args };
  }

  if (tool === 'getPokemon') {
    return { name: args.name ?? args.id ?? args.query, locale };
  }

  if (tool === 'getEvolutionChain') {
    return { name: args.name ?? args.id ?? args.query };
  }

  if (tool === 'comparePokemons') {
    return { a: args.a ?? args.first ?? args.left, b: args.b ?? args.second ?? args.right };
  }

  if (tool === 'getTypeEffectiveness') {
    return {
      attackerTypes: args.attackerTypes ?? args.attackers ?? [],
      defenderTypes: args.defenderTypes ?? args.defenders ?? [],
    };
  }

  if (tool === 'getBestCounters') {
    return { target: args.target ?? args.name ?? args.query, limit: args.limit ?? 5 };
  }

  if (tool === 'getStrongestByType') {
    return {
      type: args.type ?? args.name ?? args.query,
      limit: args.limit ?? 3,
      maxCandidates: args.maxCandidates ?? 0,
    };
  }

  if (tool === 'getPokemonEncounters') {
    return { name: args.name ?? args.id ?? args.query, limit: args.limit ?? 8 };
  }

  if (tool === 'estimateMoveDamage') {
    return {
      attacker: args.attacker ?? args.a ?? args.user ?? args.source,
      defender: args.defender ?? args.b ?? args.target ?? args.enemy,
      move: args.move ?? args.attack ?? args.skill ?? args.name,
      level: args.level ?? args.lvl,
      nature: args.nature,
      attackerEvs: args.attackerEvs ?? args.evsAttacker ?? args.attackerEVs,
      defenderEvs: args.defenderEvs ?? args.evsDefender ?? args.defenderEVs,
    };
  }

  if (tool === 'suggestTeammates') {
    return {
      target: args.target ?? args.name ?? args.query,
      limit: args.limit ?? 5,
      maxCandidates: args.maxCandidates ?? 60,
    };
  }

  return args;
}

function isValidArgs(tool: ToolName, args: Record<string, unknown>): boolean {
  if (tool === 'getPokemon') {
    return typeof args.name === 'string' && args.name.trim().length > 0;
  }
  if (tool === 'getEvolutionChain') {
    return typeof args.name === 'string' && args.name.trim().length > 0;
  }
  if (tool === 'comparePokemons') {
    return (
      typeof args.a === 'string' &&
      args.a.trim().length > 0 &&
      typeof args.b === 'string' &&
      args.b.trim().length > 0
    );
  }
  if (tool === 'getTypeEffectiveness') {
    return Array.isArray(args.attackerTypes) && Array.isArray(args.defenderTypes);
  }
  if (tool === 'getBestCounters') {
    return typeof args.target === 'string' && args.target.trim().length > 0;
  }
  if (tool === 'getStrongestByType') {
    return typeof args.type === 'string' && args.type.trim().length > 0;
  }
  if (tool === 'getPokemonEncounters') {
    return typeof args.name === 'string' && args.name.trim().length > 0;
  }
  if (tool === 'estimateMoveDamage') {
    return (
      typeof args.attacker === 'string' &&
      args.attacker.trim().length > 0 &&
      typeof args.defender === 'string' &&
      args.defender.trim().length > 0 &&
      typeof args.move === 'string' &&
      args.move.trim().length > 0
    );
  }
  if (tool === 'suggestTeammates') {
    return typeof args.target === 'string' && args.target.trim().length > 0;
  }
  return true;
}

function deriveEntities(
  toolResults: Array<{ tool: ToolName; args: Record<string, unknown>; result: unknown }>
): string[] {
  const entities = new Set<string>();

  toolResults.forEach((entry) => {
    const result = entry.result as Record<string, unknown> | undefined;
    if (!result) return;
    if (typeof result.name === 'string') entities.add(result.name);
    if (Array.isArray(result.counters)) {
      result.counters.forEach((c) => {
        if (c && typeof c.name === 'string') entities.add(c.name);
      });
    }
    if (Array.isArray(result.strongest)) {
      result.strongest.forEach((c) => {
        if (c && typeof c.name === 'string') entities.add(c.name);
      });
    }
    if (Array.isArray(result.teammates)) {
      result.teammates.forEach((c) => {
        if (c && typeof c.name === 'string') entities.add(c.name);
      });
    }
    if (Array.isArray(result.stages)) {
      result.stages.flat().forEach((name) => {
        if (typeof name === 'string') entities.add(name);
      });
    }
    if (typeof result.attacker === 'object' && result.attacker && 'name' in result.attacker) {
      const name = (result.attacker as { name?: string }).name;
      if (name) entities.add(name);
    }
    if (typeof result.defender === 'object' && result.defender && 'name' in result.defender) {
      const name = (result.defender as { name?: string }).name;
      if (name) entities.add(name);
    }
    if (typeof result.target === 'object' && result.target && 'name' in result.target) {
      const name = (result.target as { name?: string }).name;
      if (name) entities.add(name);
    }
    if (typeof result.a === 'object' && result.a && 'name' in result.a) {
      const name = (result.a as { name?: string }).name;
      if (name) entities.add(name);
    }
    if (typeof result.b === 'object' && result.b && 'name' in result.b) {
      const name = (result.b as { name?: string }).name;
      if (name) entities.add(name);
    }
  });

  return Array.from(entities);
}
