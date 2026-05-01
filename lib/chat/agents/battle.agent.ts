import { BaseAgent } from './base.agent';
import type { AgentExecutionResult } from './base.agent';
import type { SessionData } from '../memory';
import { runExecutor } from '../executor';

/**
 * BattleAgent — especialista en batalla y efectividad de tipos
 * Maneja: comparación de Pokémon, cálculo de daño, type matchups, contadores
 */
export class BattleAgent extends BaseAgent {
  constructor() {
    super({
      name: 'BattleAgent',
      intent: 'BATTLE',
      systemPrompt:
        'You are the BATTLE specialist agent. ' +
        'Your expertise is: type effectiveness, damage calculation, battle strategy, and Pokémon matchups. ' +
        'Analyze battles, estimate damage, and explain type advantages using available tools.',
      tools: [
        'comparePokemons',
        'estimateMoveDamage',
        'getTypeEffectiveness',
        'getBestCounters',
      ],
      description: 'Especialista en batalla, efectividad de tipos y cálculo de daño',
    });
  }

  async execute(params: {
    message: string;
    locale: 'en' | 'es';
    memory: SessionData;
  }): Promise<AgentExecutionResult> {
    if (process.env.DEBUG) console.log('[BattleAgent] Ejecutando con mensaje:', params.message);

    const subIntent = await this.classifySubIntent(params.message);
    let executorMode: 'BATTLE' | 'COUNTERS' = 'BATTLE';

    if (subIntent === 'counters') {
      executorMode = 'COUNTERS';
    }

    const result = await runExecutor({
      mode: executorMode,
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

    if (/cuanto.*da[ñn]o|damage.*estim|calcul.*da[ñn]o/.test(normalized)) {
      return 'damage_estimation';
    }

    if (/(vs|versus|contra|pelea|batalla|ganaria|who.*win|fight)/.test(normalized)) {
      return 'comparison';
    }

    if (/(counter|contador|le gana|fuerte contra|weakness|weak to)/.test(normalized)) {
      return 'counters';
    }

    if (/(type|efectividad|advantage|desventaja)/.test(normalized)) {
      return 'type_effectiveness';
    }

    return null;
  }
}
