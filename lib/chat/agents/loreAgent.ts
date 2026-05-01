import { SystemMessage } from '@langchain/core/messages';
import { chatModel } from './ollama';
import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'pokemon.db');

export async function loreNode(state: any) {
  const lastMessage = state.messages[state.messages.length - 1].content;
  
  let dbResult = '';
  try {
    const db = new Database(DB_PATH, { readonly: true });
    
    // Extract a search term from the user's query
    const keywordPrompt = new SystemMessage(`
      Extract the main Pokemon name or keyword from the user's query.
      Output ONLY the word, nothing else. Example: pikachu
    `);
    const keywordResponse = await chatModel.invoke([keywordPrompt, state.messages[state.messages.length - 1]]);
    let keyword = (keywordResponse.content as string).trim().toLowerCase();
    // Remove punctuation to prevent FTS5 syntax errors
    keyword = keyword.replace(/[^\w\s]/gi, '');
    
    const rows = db.prepare(`SELECT * FROM lore WHERE lore MATCH ?`).all(keyword);
    dbResult = JSON.stringify(rows);
    
    db.close();
  } catch (err: any) {
    dbResult = 'Database query failed: ' + err.message;
  }
  
  const finalPrompt = new SystemMessage(`
    You are the Pokemon Lore Agent. You specialize in anime history, relationships, and trivia.
    Use the following RAG retrieved knowledge to answer the user's question.
    Knowledge: ${dbResult}
  `);
  
  const response = await chatModel.invoke([finalPrompt, state.messages[state.messages.length - 1]]);
  return { messages: [response], nextAgent: 'verify' };
}
