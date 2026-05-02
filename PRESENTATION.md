# 🔮 Pokédex Arcana - Multi-Agent System

Bienvenido a **Pokédex Arcana**, una enciclopedia Pokémon inteligente que no solo muestra datos básicos, sino que es capaz de analizar estadísticas, relatar historias del anime y calcular daño competitivo real sin "alucinar" (inventar información).

---

## 📌 ¿Qué es esta aplicación?
Pokédex Arcana es una aplicación web (construida con Next.js) que integra un Chatbot avanzado. A diferencia de un chatbot tradicional (como ChatGPT) que depende exclusivamente de su memoria para responder, este sistema actúa como un **"Cerebro Orquestador"**. Cuando el usuario hace una pregunta, el sistema clasifica la intención de la misma y delega el trabajo a un "Agente Experto" que posee herramientas y bases de datos especializadas para dar una respuesta matemática o históricamente exacta.

---

## 🏗️ ¿Cómo está construida? (Arquitectura)
La aplicación pasó de ser un endpoint de chat básico a una robusta arquitectura **Multi-Agente** utilizando el ecosistema de **LangChain** y **LangGraph**.

### El Flujo de LangGraph
1. **Router Node**: Lee el mensaje del usuario y decide a quién llamar (Data, Lore, Competitive o General).
2. **Agentes Especializados**:
   - 🗄️ **Data Agent**: Escribe código SQL dinámico para consultar estadísticas numéricas en una base de datos local SQLite.
   - 📖 **Lore Agent**: Utiliza Búsqueda de Texto Completo (FTS5) en SQLite a modo de RAG ligero para encontrar historias, relaciones y descripciones (Flavor Text) de la Pokédex.
   - ⚔️ **Competitive Agent**: En lugar de estimar, utiliza la librería oficial de torneos `@smogon/calc` para ejecutar simulaciones de daño matemático exacto (Generación 9).
3. **Verify Node**: El "supervisor" que lee la respuesta final del agente y se asegura de que no contenga errores graves antes de enviarla al frontend.

### Stack Tecnológico
* **Frontend/Backend:** Next.js, React, Tailwind CSS.
* **Orquestación AI:** `@langchain/langgraph`, `@langchain/openai`.
* **Motor LLM:** **OpenRouter** (Cloud LLM routing) para inferencia rápida y gratuita (`openrouter/free`).
* **Base de Datos:** SQLite (`better-sqlite3`) para almacenamiento estructurado y vectorial (FTS5).
* **Matemáticas:** `@smogon/calc`.

---

## 🚀 Guía de Ejecución (Cómo correr la app)

Para levantar este proyecto en tu entorno local, asegúrate de cumplir con los siguientes pasos:

### 1. Requisitos Previos
- **Node.js** (v18 o superior).
- Una cuenta en [OpenRouter.ai](https://openrouter.ai/) para obtener una API Key gratuita.

### 2. Variables de Entorno
Crea un archivo llamado `.env.local` en la raíz del proyecto y agrega tu llave de OpenRouter:
```env
OPENROUTER_API_KEY=tu_clave_de_api_aqui
```

### 3. Instalación e Inicialización
Abre tu terminal en la carpeta del proyecto y ejecuta:
```bash
# 1. Instalar las dependencias
npm install

# 2. Inicializar y popular la base de datos (Opcional si ya tienes pokemon.db)
# Esto crea las tablas de SQLite y descarga los primeros 151 Pokémon desde la PokeAPI
npx tsx scripts/init_db.ts
npx tsx scripts/seed_pokeapi.ts

# 3. Arrancar el servidor de desarrollo
npm run dev
```

Una vez que diga `Ready`, abre [http://localhost:3000](http://localhost:3000) en tu navegador y empieza a chatear con la Pokédex.

---

## 🐛 Problemas que enfrentamos (y cómo los solucionamos)

Durante el desarrollo de esta transformación a Multi-Agente, nos encontramos con varios cuellos de botella técnicos muy interesantes:

### 1. Problemas de "Escaping" y Sintaxis en TypeScript
**Problema:** Al generar los archivos de los Agentes, la herramienta introdujo barras invertidas extra `\`` antes de los *Template Literals* (backticks) y escapó variables como `\${dbResult}`. Esto causó que Next.js crasheara con un error 500 (Syntax Error) y que las consultas a la base de datos no se inyectaran al modelo.
**Solución:** Escribimos y ejecutamos scripts de Node.js (`scripts/fix.js`) usando expresiones regulares (Regex) para iterar sobre todos los agentes, limpiar la sintaxis y arreglar la interpolación masivamente.

### 2. El Cuello de Botella del LLM Local (Velocidad)
**Problema:** Inicialmente configuramos el sistema para usar un modelo de Ollama local (`qwen3:1.7b`) corriendo en CPU. Debido a que LangGraph hace hasta 4 llamadas secuenciales por pregunta (Router -> Keyword -> SQL -> Verify), el sistema tardaba entre 1 y 2 minutos en responder, quedándose trabado en "Pensando...".
**Solución:** Desacoplamos Ollama y migramos a `@langchain/openai` utilizando la API de **OpenRouter**. Aprovechamos su endpoint `openrouter/free` de ruteo automático, reduciendo el tiempo total de respuesta a tan solo ~15 segundos.

### 3. Case Sensitivity en SQLite (Base de datos "vacía")
**Problema:** Cuando el usuario preguntaba por "Machop", el Data Agent generaba el SQL: `SELECT * FROM pokemon WHERE name = 'Machop'`. Debido a que SQLite es "Case Sensitive" y guardamos los nombres en minúsculas (`machop`), la base de datos devolvía un array vacío `[]`. El LLM, al no recibir datos, asumía y le decía al usuario que "la base de datos proporcionada estaba vacía".
**Solución:** Se implementó *Prompt Engineering* en `dataAgent.ts`. Se instruyó estrictamente al generador de SQL a utilizar comandos tolerantes como `LOWER()` o `LIKE '%nombre%'`.

### 4. Cambios de API en LangChain (Missing Credentials)
**Problema:** Tras migrar a `@langchain/openai`, recibimos de inmediato un error 500 con el mensaje `Missing credentials`. A pesar de tener la llave de OpenRouter configurada, el sistema no la leía.
**Solución:** Descubrimos que las versiones modernas de LangChain deprecaron la propiedad `openAIApiKey` a favor de simplemente `apiKey` en el constructor de `ChatOpenAI`. Un rápido renombre del parámetro restauró la conexión.

---
*Pokédex Arcana - Desarrollado y refactorizado exitosamente con Arquitectura LangGraph Multi-Agente.*
