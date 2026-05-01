import { BaseAgent } from './base.agent';
import type { AgentExecutionResult } from './base.agent';
import type { SessionData } from '../memory';
import { runExecutor } from '../executor';

/**
 * TeamAgent — especialista en composición de equipos competitivos
 * Maneja: armar equipos, sinergia, cobertura de tipos, meta OU
 */
export class TeamAgent extends BaseAgent {
  constructor() {
    super({
      name: 'TeamAgent',
      intent: 'TEAM',
      systemPrompt:
        'You are the TEAM specialist agent. ' +
        'Your expertise is building competitive Pokémon teams with synergy, type coverage, and meta analysis. ' +
        'Recommend Pokémon combinations, explain team synergy, and suggest partners using available tools.',
      tools: ['suggestTeammates', 'getPokemon', 'getTypeEffectiveness', 'getBestCounters'],
      description: 'Especialista en armar equipos competitivos con sinergia y cobertura de tipos',
    });
  }

  async execute(params: {
    message: string;
    locale: 'en' | 'es';
    memory: SessionData;
  }): Promise<AgentExecutionResult> {
    if (process.env.DEBUG) console.log('[TeamAgent] Ejecutando con mensaje:', params.message);

    const result = await runExecutor({
      mode: 'TEAM',
      message: params.message,
      locale: params.locale,
      memory: params.memory,
    });

    return {
      content: result.content,
      memoryUpdate: result.memoryUpdate,
    };
  }

  async classifySubIntent(message: string): Promise<string | null> {
    const normalized = message.toLowerCase();

    if (/cobertura|coverage|synerg[íi]a|synergy/.test(normalized)) {
      return 'coverage_and_synergy';
    }

    if (/ou|competitivo|competitive|meta|tier/.test(normalized)) {
      return 'meta_analysis';
    }

    if (/compa[ñn]ero|partner|teammate|que.*acompa[ñn]e/.test(normalized)) {
      return 'teammate_suggestion';
    }

    if (/arma|build|crear|create|equipo|team/.test(normalized)) {
      return 'team_building';
    }

    return null;
  }
}
