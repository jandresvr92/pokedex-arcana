# README_2 - Documentacion tecnica

## Resumen

Este proyecto extiende Pokdex Arcana con un sistema multi-agente para responder preguntas en lenguaje natural sobre Pokemon. La solucion agrega un endpoint de chat, un orquestador (rule-based), un executor con LLM (Qwen2 via Ollama), herramientas internas (tools), memoria por sesion y cache simple en servidor. El objetivo es responder con datos reales de PokeAPI y razonamiento estructurado.

## Fase de planeacion y preguntas clave

Durante la planeacion se definio el flujo y se resolvieron ambiguedades:

- Alcance: primero diseno y preguntas, luego implementacion.
- Backend: orquestador y executor viven en una API route de Next.js.
- Modelo open-source: Qwen2 via Ollama.
- Tools: deben crearse desde cero.
- Uso obligatorio de tools: solo cuando la respuesta depende de datos verificables o calculos.
- Memoria: servidor por sesion (Map) con TTL.
- UI: se usa el boton de chatbot ya existente.
- Locale: la respuesta sigue el idioma actual.
- Output: JSON simple { type: "text", content: "string" }.
- Orquestador: reglas por keywords, fallback a LLM solo si no clasifica.
- Executor: unico agente con LLM, obligado a usar tools si necesita datos.

## Arquitectura multi-agente

### Orquestador (decisor)

- Clasifica la intencion: INFO, BATTLE, COUNTERS, TEAM, REPORT.
- Usa reglas por palabras clave.
- Si no hay match, hace fallback a LLM (clasificacion breve).
- No genera respuesta final.

### Executor (resolvedor)

- Recibe: mode, message, memory, locale.
- Ejecuta tools segun necesidad.
- Genera la respuesta final en lenguaje natural.
- Regla critica: no inventa datos y usa tools cuando aplica.

## Endpoint de chat

POST /api/chat

Input:

{
  "sessionId": "string",
  "locale": "es|en",
  "message": "string"
}

Output:

{
  "type": "text",
  "content": "string"
}

## Tools implementadas

- getPokemon(name, locale)
  - Datos base, tipos, stats, habilidades, descripcion.
- getEvolutionChain(name)
  - Cadena de evoluciones en etapas.
- getTypeEffectiveness(attackerTypes, defenderTypes)
  - Multiplicadores por tipo usando damage relations.
- comparePokemons(a, b)
  - Comparacion de stats + efectividad de tipos.
- getBestCounters(target, limit)
  - Ranking simple por ventaja de tipo y total de stats.

## Memoria y cache

### Memoria por sesion

- Map<sessionId, { history, team, lastEntities, expiresAt }>
- history: max 5 mensajes
- TTL: 30 minutos

### Cache simple

- Map<key, { data, expiresAt }>
- TTL:
  - Pokemon: 10 min
  - Types: 1 hora
  - Evoluciones: 1 hora

## Logica de razonamiento

- Orquestador: keywords + fallback a LLM.
- Executor:
  - Decide tools segun intent.
  - Usa resultados para explicar (stats, tipos, counters, etc).
  - Solo usa Markdown cuando el intent es REPORT.

## Archivos relevantes

- app/api/chat/route.ts
  - Endpoint POST /api/chat, orquestacion y respuesta final.
- lib/chat/orchestrator.ts
  - Clasificador por keywords + fallback a LLM.
- lib/chat/executor.ts
  - Planner, ejecucion de tools, generacion final con Qwen2.
- lib/chat/tools.ts
  - Implementacion de tools y llamadas a PokeAPI.
- lib/chat/memory.ts
  - Memoria por sesion con TTL y limite de historial.
- lib/chat/cache.ts
  - Cache en memoria para PokeAPI.
- lib/chat/ollama.ts
  - Cliente para Ollama (Qwen2).
- components/chat/ChatBot.tsx
  - UI del chatbot y llamada al endpoint.
- lib/types.ts
  - Tipos PokeAPI ampliados (damage relations, evolution chain).

## Variables de entorno

- OLLAMA_URL (default: http://localhost:11434)
- OLLAMA_MODEL (default: qwen2)

## Notas de uso

- Ollama debe estar instalado y el modelo qwen2 disponible.
- El chat usa sessionId guardado en localStorage.
- Respuesta siempre retorna JSON { type, content }.
