const fs = require('fs');
const path = require('path');
const files = [
  'verifyAgent.ts', 
  'orchestrator.agent.ts', 
  'loreAgent.ts', 
  'graph.ts', 
  'dataAgent.ts', 
  'competitiveAgent.ts'
].map(f => path.join(__dirname, '../lib/chat/agents', f));

for (const f of files) {
  let content = fs.readFileSync(f, 'utf8');
  content = content.replace(/\\\`/g, '`');
  fs.writeFileSync(f, content);
}
console.log("Fixed!");
