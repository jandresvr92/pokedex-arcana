# README_2 - Documentacion tecnica

## Resumen

Este proyecto extiende Pokdex Arcana con un sistema multi-agente para responder preguntas en lenguaje natural sobre Pokemon. La solucion agrega un endpoint de chat, un orquestador (rule-based), un executor con LLM (OpenRouter), herramientas internas (tools), memoria por sesion y cache simple en servidor. El objetivo es responder con datos reales de PokeAPI y razonamiento estructurado.

## Fase de planeacion y preguntas clave

Durante la planeacion se definio el flujo y se resolvieron ambiguedades:

- Alcance: primero diseno y preguntas, luego implementacion.
- Backend: orquestador y executor viven en una API route de Next.js.
- Modelo externo: OpenRouter (configurable por .env.local).
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

- Mision: decidir el tipo de consulta sin ejecutar datos.
- Clasifica la intencion: INFO, BATTLE, COUNTERS, TEAM, REPORT.
- Usa reglas por palabras clave.
- Si no hay match, hace fallback a LLM (clasificacion breve).
- No genera respuesta final.

### Executor (resolvedor)

- Mision: resolver la pregunta usando datos y calculos.
- Recibe: mode, message, memory, locale.
- Genera un plan determinista y si falla, pide plan al LLM.
- Ejecuta tools segun necesidad.
- Genera la respuesta final en lenguaje natural.
- Regla critica: no inventa datos y usa tools cuando aplica.

### Como se conectan

- UI (ChatBot) envia message y sessionId a /api/chat.
- Orquestador clasifica el intent (keywords + fallback a LLM).
- Executor arma plan, llama tools, y produce respuesta final.
- La respuesta vuelve al frontend como JSON { type, content }.

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
- getStrongestByType(type, limit)
  - Top por total de stats dentro del tipo.
- getPokemonEncounters(name, limit)
  - Lugares donde aparece un Pokemon.
- estimateMoveDamage(attacker, defender, move, level, nature, evs)
  - Estimacion de dano con STAB, efectividad y rango.
- suggestTeammates(target, limit)
  - Sugerencias que cubren debilidades con heuristica.

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
  - Plan determinista primero, LLM solo si hace falta.
  - Decide tools segun intent.
  - Usa resultados para explicar (stats, tipos, counters, dano, etc).
  - Solo usa Markdown cuando el intent es REPORT.

## Archivos relevantes

- app/api/chat/route.ts
  - Endpoint POST /api/chat, orquestacion y respuesta final.
- lib/chat/orchestrator.ts
  - Clasificador por keywords + fallback a LLM.
- lib/chat/executor.ts
  - Planner, ejecucion de tools, generacion final con LLM.
- lib/chat/tools.ts
  - Implementacion de tools y llamadas a PokeAPI.
- lib/chat/memory.ts
  - Memoria por sesion con TTL y limite de historial.
- lib/chat/cache.ts
  - Cache en memoria para PokeAPI.
- lib/chat/llm.ts
  - Cliente para OpenRouter.
- components/chat/ChatBot.tsx
  - UI del chatbot y llamada al endpoint.
- lib/types.ts
  - Tipos PokeAPI ampliados (damage relations, evolution chain).

## Variables de entorno

- OPENROUTER_URL (default: https://openrouter.ai/api/v1/chat/completions)
- OPENROUTER_MODEL (default configurable)
- OPENROUTER_TIMEOUT_MS (default: 90000)
- OPENROUTER_API_KEY (required)
- OPENROUTER_SITE_URL (optional)
- OPENROUTER_APP_NAME (optional)

## Notas de uso

- Configura OPENROUTER_API_KEY y un modelo valido.
- El chat usa sessionId guardado en localStorage.
- Respuesta siempre retorna JSON { type, content }.
