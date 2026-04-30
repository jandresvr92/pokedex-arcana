# Contexto recuperado - Pokedex Arcana

## Resumen general del proyecto
Pokedex Arcana es una app web con Next.js 14 (App Router), Tailwind CSS y TypeScript. Consume PokeAPI, ofrece busqueda, listado paginado, modal con detalles y soporte i18n (es/en). Incluye un chatbot en la esquina inferior derecha para consultas.

## Cambios funcionales recientes
- Se agregaron dos pestañas nuevas en el modal de Pokemon: "Fuerte contra" y "Debil contra".
- Cada pesta muestra 3 Pokemon en mini tarjetas con imagen, nombre y ID.
- La seleccion se basa en relaciones de tipos de PokeAPI (double damage) y es aleatoria.

Archivos tocados:
- components/pokemon/PokemonModal.tsx
- lib/pokeapi.ts
- lib/types.ts

## Plan del sistema multi-agente (acordado)
- Endpoint unico: POST /api/chat
- Input: { sessionId, locale, message }
- Output: { type: "text", content }
- Orquestador: reglas por keywords; fallback a LLM solo si no clasifica
- Executor: unico agente con Qwen2 via Ollama
- Tools minimas:
  - getPokemon({ name, locale? })
  - getEvolutionChain({ name })
  - getTypeEffectiveness({ attackerTypes, defenderTypes })
  - comparePokemons({ a, b })
  - getBestCounters({ target, limit=5 })
- Memoria: Map en servidor con history (ultimos 5), team, lastEntities; TTL 30 min
- Cache: Map con TTL (pokemon 10 min, tipos 1h, evoluciones 1h)
- Sin streaming
- Regla critica: el executor debe usar tools cuando la respuesta depende de datos reales

## Implementacion iniciada (estado)
Se empezaron a crear los modulos base del sistema de chat y tools.

Archivos nuevos:
- lib/chat/cache.ts
- lib/chat/memory.ts
- lib/chat/ollama.ts
- lib/chat/orchestrator.ts
- lib/chat/tools.ts
- lib/chat/executor.ts
- app/api/chat/route.ts

Cambios en UI:
- components/chat/ChatBot.tsx: ahora envia mensajes a /api/chat con sessionId y locale

Cambios en tipos:
- lib/types.ts: se extendieron relaciones de tipos y evolucion

## Pendientes sugeridos
- Verificar tipos y lint (errores TS) tras los cambios
- Probar /api/chat con Ollama activo y modelo Qwen2
- Validar que las tools devuelvan datos coherentes y que el executor respete la regla de tools
- Confirmar que el chatbot renderiza correctamente respuestas largas y errores

