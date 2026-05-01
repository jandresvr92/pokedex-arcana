import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { MasterOrchestrator } from '../lib/chat/agents/orchestrator.agent';

async function main() {
  console.log("Starting MasterOrchestrator test...");
  const orchestrator = new MasterOrchestrator();
  
  console.time("Total Execution Time");
  try {
    const result = await orchestrator.execute({
      message: 'Quien es Blastoise?',
      locale: 'es',
      memory: { id: 'test_session', messages: [] }
    });
    console.log("Result:", result);
  } catch (err) {
    console.error("Error during execution:", err);
  }
  console.timeEnd("Total Execution Time");
}

main();
