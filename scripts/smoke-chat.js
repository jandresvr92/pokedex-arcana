const fetch = global.fetch || require('node-fetch');
const url = process.env.SMOKE_URL || 'http://localhost:3000/api/chat';
const message = process.argv.slice(2).join(' ') || 'Prueba rápida: ¿Quién es Pikachu?';
const sessionId = 'smoke-script';

(async () => {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, locale: 'es', message }),
    });
    const text = await res.text();
    console.log('Status:', res.status);
    console.log('Response:', text);
  } catch (err) {
    console.error('Error calling chat:', err);
    process.exit(1);
  }
})();
