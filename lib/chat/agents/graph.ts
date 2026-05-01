import { StateGraph, START, END, MemorySaver, Annotation } from '@langchain/langgraph';
import { BaseMessage, HumanMessage, AIMessage, SystemMessage } from '@langchain/core/messages';
import { chatModel } from './ollama';
import { dataNode } from './dataAgent';
import { competitiveNode } from './competitiveAgent';
import { loreNode } from './loreAgent';
import { verifyNode } from './verifyAgent';

export const AgentState = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (x, y) => x.concat(y),
  }),
  nextAgent: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => '',
  }),
  verified: Annotation<boolean>({
    reducer: (x, y) => y ?? x,
    default: () => false,
  })
});

async function routerNode(state: typeof AgentState.State) {
  const lastMessage = state.messages[state.messages.length - 1];
  
  // Decide who should handle this based on the message content
  const routerPrompt = new SystemMessage(`
    You are a specialized router for a Pokemon application.
    Analyze the user's message and decide which agent should handle it.
    Options:
    - 'data': For basic pokemon stats, types, or filtering databases (e.g., "what are jigglypuff stats").
    - 'competitive': For damage calculations, competitive teams, OU tiers, and smogon strategies.
    - 'lore': For questions about the anime, relationships, history, and flavor text.
    - 'general': For everything else.
    
    Respond ONLY with the name of the option, nothing else.
  `);
  
  const response = await chatModel.invoke([routerPrompt, lastMessage]);
  const decision = (response.content as string).toLowerCase().trim();
  
  let next = 'general';
  if (decision.includes('data')) next = 'data';
  else if (decision.includes('competitive')) next = 'competitive';
  else if (decision.includes('lore')) next = 'lore';

  return { nextAgent: next };
}

async function generalNode(state: typeof AgentState.State) {
  const prompt = new SystemMessage('You are a helpful Pokemon assistant.');
  const response = await chatModel.invoke([prompt, ...state.messages]);
  return { messages: [response], nextAgent: 'verify' };
}

export function buildGraph() {
  const workflow = new StateGraph(AgentState)
    .addNode('router', routerNode)
    .addNode('data', dataNode)
    .addNode('competitive', competitiveNode)
    .addNode('lore', loreNode)
    .addNode('general', generalNode)
    .addNode('verify', verifyNode)

    .addEdge(START, 'router')
    .addConditionalEdges('router', (state) => state.nextAgent, {
      'data': 'data',
      'competitive': 'competitive',
      'lore': 'lore',
      'general': 'general'
    })
    .addEdge('data', 'verify')
    .addEdge('competitive', 'verify')
    .addEdge('lore', 'verify')
    .addEdge('general', 'verify')
    .addConditionalEdges('verify', (state) => {
      // If verification failed, it might route back or end
      if (!state.verified) {
        return END; // For now just end, but we could retry
      }
      return END;
    });

  const checkpointer = new MemorySaver();
  return workflow.compile({ checkpointer });
}
