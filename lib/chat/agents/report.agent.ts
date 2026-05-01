import { BaseAgent } from './base.agent';
import type { AgentExecutionResult } from './base.agent';
import type { SessionData } from '../memory';
import { InfoAgent } from './info.agent';
import { BattleAgent } from './battle.agent';
import { TeamAgent } from './team.agent';

/**
 * ReportAgent — especialista en reportes integrales
 * Orquesta múltiples agentes para crear análisis comprehensivos
 * Ejemplo: "Reporte: Dragapult" → Info + Battle Analysis + Team Recommendations
 */
export class ReportAgent extends BaseAgent {
  private infoAgent: InfoAgent;
  private battleAgent: BattleAgent;
  private teamAgent: TeamAgent;

  constructor() {
    super({
      name: 'ReportAgent',
      intent: 'REPORT',
      systemPrompt:
        'You are the REPORT specialist agent. ' +
        'Your role is to orchestrate other specialist agents to create comprehensive analysis. ' +
        'Combine information, battle analysis, and team recommendations into a detailed, well-structured report.',
      tools: [
        'getPokemon',
        'comparePokemons',
        'suggestTeammates',
        'estimateMoveDamage',
        'getEvolutionChain',
        'getPokemonEncounters',
      ],
      description: 'Especialista en reportes integrales (orquesta múltiples agentes)',
    });
    this.infoAgent = new InfoAgent();
    this.battleAgent = new BattleAgent();
    this.teamAgent = new TeamAgent();
  }

  async execute(params: {
    message: string;
    locale: 'en' | 'es';
    memory: SessionData;
  }): Promise<AgentExecutionResult> {
    if (process.env.DEBUG) console.log('[ReportAgent] Ejecutando con mensaje:', params.message);

    // Extrae el Pokémon del mensaje
    const pokemonName = this.extractPokemonName(params.message);
    if (!pokemonName) {
      const content = params.locale === 'es'
        ? 'No pude extraer el Pokémon del mensaje. Intenta: "Reporte: Pikachu"'
        : 'Could not extract Pokémon name. Try: "Report: Pikachu"';
      return { content };
    }

    if (process.env.DEBUG) console.log(`[ReportAgent] Generando reporte para: ${pokemonName}`);

    // Orquesta múltiples agentes en paralelo
    const [infoResult, battleResult, teamResult] = await Promise.all([
      this.infoAgent.execute({
        message: params.locale === 'es' 
          ? `Cuéntame sobre ${pokemonName}` 
          : `Tell me about ${pokemonName}`,
        locale: params.locale,
        memory: params.memory,
      }),
      this.battleAgent.execute({
        message: params.locale === 'es'
          ? `Análisis de batalla para ${pokemonName}`
          : `Battle analysis for ${pokemonName}`,
        locale: params.locale,
        memory: params.memory,
      }),
      this.teamAgent.execute({
        message: params.locale === 'es'
          ? `Arma un equipo con ${pokemonName}`
          : `Build a team with ${pokemonName}`,
        locale: params.locale,
        memory: params.memory,
      }),
    ]);

    // Combina resultados en un reporte estructurado
    const combined = params.locale === 'es'
      ? `## 📋 REPORTE: ${pokemonName}\n\n` +
        `### 📖 Información General\n${infoResult.content}\n\n` +
        `### ⚔️ Análisis de Batalla\n${battleResult.content}\n\n` +
        `### 👥 Equipo Recomendado\n${teamResult.content}`
      : `## 📋 REPORT: ${pokemonName}\n\n` +
        `### 📖 General Information\n${infoResult.content}\n\n` +
        `### ⚔️ Battle Analysis\n${battleResult.content}\n\n` +
        `### 👥 Recommended Team\n${teamResult.content}`;

    return {
      content: combined,
      memoryUpdate: {
        team: teamResult.memoryUpdate?.team,
        lastEntities: [pokemonName],
      },
    };
  }

  async classifySubIntent(message: string): Promise<string | null> {
    return 'comprehensive_report';
  }

  private extractPokemonName(message: string): string | null {
    // Patrones: "Reporte: Pikachu", "Report: Dragapult", "reporte sobre Pikachu"
    const match = message.match(
      /reporte[\s:]+([A-Za-z0-9À-ÖØ-öø-ÿ'-]+)|report[\s:]+([A-Za-z0-9À-ÖØ-öø-ÿ'-]+)|reporte.*sobre\s+([A-Za-z0-9À-ÖØ-öø-ÿ'-]+)/i
    );
    return match ? (match[1] || match[2] || match[3]) : null;
  }
}
