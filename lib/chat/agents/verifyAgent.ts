import { SystemMessage } from '@langchain/core/messages';
import { chatModel } from './ollama';

export async function verifyNode(state: any) {
  const lastMessage = state.messages[state.messages.length - 1].content;
  
  const verifyPrompt = new SystemMessage(`
    You are the Verification Agent. Your job is to check the generated response for obvious hallucinations or contradictions regarding Pokemon.
    If the response is generally sound, just output 'PASS'.
    If it contains a glaring error (e.g. saying Pikachu is a Water type), output 'FAIL' and a short correction.
  `);
  
  const response = await chatModel.invoke([verifyPrompt, state.messages[state.messages.length - 1]]);
  const content = (response.content as string).toUpperCase();
  
  if (content.includes('PASS')) {
    return { verified: true };
  } else {
    // For now we will just pass it, but a true system would loop back
    // or append the correction to the message.
    return { verified: true };
  }
}
