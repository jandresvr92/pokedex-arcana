import { BaseAgent } from './base.agent';
import type { AgentExecutionResult } from './base.agent';
import type { SessionData } from '../memory';
import { runExecutor } from '../executor';

/**
 * InfoAgent — especialista en datos de Pokémon
 * Maneja: tipos, stats, habilidades, evoluciones, ubicaciones, lore
 */
export class InfoAgent extends BaseAgent {
  constructor() {
    super({
      name: 'InfoAgent',
      intent: 'INFO',
      systemPrompt:
        'You are the INFO specialist agent. ' +
        'Your expertise is Pokémon data: types, stats, abilities, evolution, lore, locations, and factual information. ' +
        'Answer user questions about Pokémon using available tools. Be accurate and informative.',
      tools: ['getPokemon', 'getEvolutionChain', 'getPokemonEncounters', 'getTypeEffectiveness'],
      description: 'Especialista en datos de Pokémon (tipos, stats, habilidades, evoluciones, ubicaciones)',
    });
  }

  async execute(params: {
    message: string;
    locale: 'en' | 'es';
    memory: SessionData;
  }): Promise<AgentExecutionResult> {
    if (process.env.DEBUG) console.log('[InfoAgent] Ejecutando con mensaje:', params.message);

    // Delega al executor existente — reutiliza toda la lógica
    const result = await runExecutor({
      mode: 'INFO',
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
    if (/evoluci[óo]n|evolution|evolve/.test(normalized)) {
      return 'evolution';
    }
    if (/d[óo]nde|where|ubicaci[óo]n|location|encuent/.test(normalized)) {
      return 'location';
    }
    if (/habilidad|ability|powers/.test(normalized)) {
      return 'ability';
    }
    if (/tipo|type/.test(normalized)) {
      return 'type';
    }
    if (/stat|estad[íi]stica|power/.test(normalized)) {
      return 'stats';
    }
    if (/lore|historia|history|stor/.test(normalized)) {
      return 'lore';
    }
    return null;
  }
}
