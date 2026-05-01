import { SystemMessage } from '@langchain/core/messages';
import { chatModel } from './ollama';
import { calculate, Generations, Pokemon, Move } from '@smogon/calc';

export async function competitiveNode(state: any) {
  const lastMessage = state.messages[state.messages.length - 1].content;
  
  // A simplified competitive agent logic
  // For a real app, we would parse the exact attacker, defender, and move
  const parsePrompt = new SystemMessage(`
    You are a competitive Pokemon parser. Extract the following from the user's query if present:
    attacker, defender, move.
    Output JSON format ONLY: {"attacker": "Abomasnow", "defender": "Jigglypuff", "move": "Blizzard"}
    If not found, return empty strings.
  `);
  
  let calcResult = '';
  try {
    const parseRes = await chatModel.invoke([parsePrompt, state.messages[state.messages.length - 1]]);
    const parsed = JSON.parse(parseRes.content as string);
    
    if (parsed.attacker && parsed.defender && parsed.move) {
      const gen = Generations.get(9); // Gen 9
      const result = calculate(
        gen,
        new Pokemon(gen, parsed.attacker),
        new Pokemon(gen, parsed.defender),
        new Move(gen, parsed.move)
      );
      calcResult = result.desc();
    }
  } catch (err: any) {
    calcResult = 'Could not perform direct damage calculation due to missing or invalid data. ' + err.message;
  }
  
  const finalPrompt = new SystemMessage(`
    You are the Pokemon Competitive Agent. You specialize in damage calculations and Smogon OU strategies.
    If you have a calculation result below, use it to answer the user accurately.
    Calc Result: ${calcResult}
  `);
  
  const response = await chatModel.invoke([finalPrompt, state.messages[state.messages.length - 1]]);
  return { messages: [response], nextAgent: 'verify' };
}
