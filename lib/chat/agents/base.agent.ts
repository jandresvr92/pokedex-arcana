import type { SessionData } from '../memory';
import type { Intent } from '../orchestrator';

export interface AgentExecutionResult {
  content: string;
  memoryUpdate?: {
    team?: string[];
    lastEntities?: string[];
  };
  metadata?: Record<string, unknown>;
}

export interface AgentConfig {
  name: string;
  intent: Intent;
  systemPrompt: string;
  tools: string[];
  description: string;
}

export abstract class BaseAgent {
  protected name: string;
  protected intent: Intent;
  protected systemPrompt: string;
  protected toolNames: Set<string>;

  constructor(config: AgentConfig) {
    this.name = config.name;
    this.intent = config.intent;
    this.systemPrompt = config.systemPrompt;
    this.toolNames = new Set(config.tools);
  }

  abstract execute(params: {
    message: string;
    locale: 'en' | 'es';
    memory: SessionData;
  }): Promise<AgentExecutionResult>;

  abstract classifySubIntent(message: string): Promise<string | null>;

  getName(): string {
    return this.name;
  }

  getIntent(): Intent {
    return this.intent;
  }

  hasAccess(tool: string): boolean {
    return this.toolNames.has(tool);
  }

  getSystemPrompt(): string {
    return this.systemPrompt;
  }

  getDescription(): string {
    return this.systemPrompt;
  }
}
