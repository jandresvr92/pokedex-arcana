import { SystemMessage } from '@langchain/core/messages';
import { chatModel } from './ollama';
import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'pokemon.db');

export async function dataNode(state: any) {
  const lastMessage = state.messages[state.messages.length - 1].content;
  
  let dbResult = '';
  try {
    const db = new Database(DB_PATH, { readonly: true });
    
    // Convert natural language to SQL or just fetch all context if it's a simple POC
    // Since this is a specialized agent, we could ask the LLM to generate SQL:
    const sqlPrompt = new SystemMessage(`
      You are an expert SQLite SQL generator. 
      Generate a SQL query to answer the user's question.
      The table schema is: pokemon(id, name, types, hp, attack, defense, sp_atk, sp_def, speed, base_total, abilities).
      IMPORTANT: The 'name' column is always lowercase. You MUST use LOWER() or LIKE '%name%' when querying by name to ensure matches.
      Output ONLY the raw SQL query, no markdown, no explanation.
    `);
    
    const sqlResponse = await chatModel.invoke([sqlPrompt, state.messages[state.messages.length - 1]]);
    let sql = (sqlResponse.content as string).replace(/```sql/g, '').replace(/```/g, '').trim();
    
    // Safety check (very basic)
    if (sql.toLowerCase().includes('select')) {
      const rows = db.prepare(sql).all();
      dbResult = JSON.stringify(rows);
    } else {
      dbResult = 'Invalid SQL generated.';
    }
    
    db.close();
  } catch (err: any) {
    dbResult = 'Database query failed: ' + err.message;
  }
  
  const finalPrompt = new SystemMessage(`
    You are the Pokemon Data Agent. Use the following database result to answer the user's question accurately.
    Database Result: ${dbResult}
  `);
  
  const response = await chatModel.invoke([finalPrompt, state.messages[state.messages.length - 1]]);
  return { messages: [response], nextAgent: 'verify' };
}
