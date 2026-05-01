import { HumanMessage } from '@langchain/core/messages';
import { buildGraph } from './graph';
import type { SessionData } from '../memory';

/**
 * MasterOrchestrator — coordina todos los agentes especializados
 * utilizando LangGraph.
 */
export class MasterOrchestrator {
  private graph: any;

  constructor() {
    this.graph = buildGraph();
  }

  /**
   * Ejecuta el flujo multi-agente completo
   */
  async execute(params: {
    message: string;
    locale: 'en' | 'es';
    memory: SessionData;
  }) {
    try {
      if (process.env.DEBUG) console.log(`[MasterOrchestrator] Running LangGraph for: ${params.message}`);

      // We run the graph with the initial state
      const config = { configurable: { thread_id: params.memory?.id || 'default_thread' } };
      
      const inputs = {
        messages: [new HumanMessage(params.message)]
      };

      const result = await this.graph.invoke(inputs, config);
      
      // The last message in the state should be from the AI
      const lastMessage = result.messages[result.messages.length - 1];

      return {
        type: 'text',
        content: lastMessage.content as string,
        memoryUpdate: {}, // For now, basic memory
      };
    } catch (err) {
      if (process.env.DEBUG) console.error('[MasterOrchestrator] Error:', err);
      throw err;
    }
  }
}
