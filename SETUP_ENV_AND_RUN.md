# Setup: variables de entorno, dependencias y cómo ejecutar el proyecto

Este documento explica todo lo necesario para que un desarrollador nuevo pueda ejecutar localmente el proyecto `pokedex-arcana`.

**Resumen rápido**

- Repositorio raíz: `pokedex-arcana`
- Script de desarrollo: `npm run dev` (ejecutar desde el directorio `pokedex-arcana`)
- URL por defecto: http://localhost:3000

**Prerequisitos**

- Node.js (recomendado): 18.x o superior (Next.js 14 funciona bien con Node 18+)
- npm (v9+) o yarn
- Conexión a Internet para instalar dependencias y, opcionalmente, para usar servicios externos (OpenRouter, Ollama)

**Archivos importantes**

- Código principal: [pokedex-arcana](pokedex-arcana)
- Configuración de Next.js: [pokedex-arcana/next.config.js](pokedex-arcana/next.config.js)
- Variables locales: [pokedex-arcana/.env.local](pokedex-arcana/.env.local#L1-L10)
- README del proyecto: [pokedex-arcana/README.md](pokedex-arcana/README.md)

**Scripts útiles (en `package.json`)**

- `npm run dev` — arranca servidor de desarrollo (Next.js App Router)
- `npm run build` — build de producción
- `npm run start` — iniciar build en modo producción
- `npm run lint` — ejecutar ESLint

(Revisa [pokedex-arcana/package.json](pokedex-arcana/package.json) para detalles.)

**Dependencias clave**

Extraídas de `package.json`:

- Framework: `next` 14.2.5
- UI: `react`, `react-dom` (v18)
- i18n: `next-intl` (para ruteo por locales y traducciones)
- UI/estilos: `tailwindcss`, `autoprefixer`, `postcss`
- Utiles: `clsx`, `tailwind-merge`, `framer-motion`

DevDependencies: `typescript`, `@types/*`, `eslint`, `eslint-config-next`.

Estas son las que se instalan con `npm install`.

**Variables de entorno detectadas y su uso**

El proyecto usa varias variables para conectar con servicios LLM / chat y para controlar timeouts. Se han detectado en el repositorio los siguientes nombres (con sus valores por defecto cuando aplican):

- `OPENROUTER_URL` — URL del endpoint de OpenRouter.
  - Valor por defecto: `https://openrouter.ai/api/v1/chat/completions`
  - Uso: `lib/chat/llm.ts` para enviar mensajes a OpenRouter.
  - Requerido: **si** quieres usar la funcionalidad de chat. Si no se proporciona `OPENROUTER_API_KEY` la función lanza un error.

- `OPENROUTER_MODEL` — modelo a pedir a OpenRouter.
  - Valor por defecto: `meta-llama/llama-3.1-8b-instruct:free`

- `OPENROUTER_TIMEOUT_MS` — timeout en ms para llamadas a OpenRouter.
  - Valor por defecto: `90000`

- `OPENROUTER_API_KEY` — clave para autenticar con OpenRouter.
  - Valor: **se detectó un valor en `.env.local` del repositorio, debe ser reemplazado por cada desarrollador**. **NO** subir claves al repositorio.
  - NOTA: la función `llmChat` lanza `Error('Missing OPENROUTER_API_KEY')` si falta la clave y se invoca la ruta de chat.

- `OPENROUTER_SITE_URL`, `OPENROUTER_APP_NAME` — encabezados opcionales que se incluyen si están definidos.

- `OLLAMA_URL` — URL local/externa de Ollama (por defecto `http://localhost:11434`).
- `OLLAMA_MODEL` — modelo para Ollama (por defecto `qwen2`).
- `OLLAMA_TIMEOUT_MS` — timeout para Ollama (por defecto `30000`).
  - Uso: `lib/chat/ollama.ts`.

Otros usos de `process.env` en el código (por ejemplo `NEXT_OTEL_*` en middleware compilado) son opcionales y se usan para observabilidad o comportamiento de `next-intl`.

**Ejemplo de `.env.local`**

Nunca subas claves reales. Crea un `.env.local` en la carpeta `pokedex-arcana` con el siguiente formato (valores de ejemplo):

```env
# OpenRouter (chat) — reemplace por su propia clave/URL
OPENROUTER_URL=https://openrouter.ai/api/v1/chat/completions
OPENROUTER_MODEL=meta-llama/llama-3.1-8b-instruct:free
OPENROUTER_TIMEOUT_MS=90000
OPENROUTER_API_KEY=sk-REPLACE_WITH_YOUR_KEY
OPENROUTER_SITE_URL=
OPENROUTER_APP_NAME=

# Ollama (opcional, local)
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=qwen2
OLLAMA_TIMEOUT_MS=30000
```

El repositorio actual incluye un `.env.local` con una clave; por seguridad, reemplázala (o elimínala) antes de compartir el repositorio.

**Pasos para que tu compañero ejecute el proyecto localmente**

1. Clonar el repo y posicionarse en la carpeta del proyecto:

```bash
cd /ruta/al/repositorio/pokedex-arcana
```

2. Instalar dependencias:

```bash
npm install
```

3. Crear o actualizar `.env.local` según el ejemplo anterior.
   - **Sin LLM (fallback mock):** Deja `OPENROUTER_API_KEY=sk-REPLACE_WITH_YOUR_KEY` — el chatbot funcionará con herramientas locales.
   - **Con LLM real:** Reemplaza con tu clave de OpenRouter.

4. Ejecutar el servidor de desarrollo (desde `pokedex-arcana`):

```bash
npm run dev
# o con npx si prefieres: npx next dev
```

5. Abrir en el navegador: http://localhost:3000

**Prueba rápida del chatbot (sin interfaz web):**

En otra terminal (desde `pokedex-arcana`):

```bash
npm run smoke:chat "¿Quién es Pikachu?"
```

Respuesta esperada:
```
Status: 200
Response: {"type":"text","content":"Resumen generado sin LLM — usando solo herramientas.\n- pikachu: tipos electric. HP: 35."}
```

**Errores comunes y soluciones**

- `npm error Missing script: "dev"`:
  - Causa: ejecutaste `npm run dev` desde la carpeta equivocada (p.ej. la raíz del monorepo). Solución: entrar en `pokedex-arcana` y ejecutar `npm run dev` ahí.

- `Couldn't find any 'pages' or 'app' directory. Please create one under the project root`:
  - Causa: estás en un directorio que no contiene la carpeta `app`. Solución: asegúrate de ejecutar desde `pokedex-arcana` (la app usa App Router y la carpeta `app/` existe dentro de `pokedex-arcana`).

- `ConnectTimeoutError` o `fetch failed` al llamar a OpenRouter/Ollama:
  - Causa: la máquina no puede alcanzar el servicio remoto o la URL/API key es inválida.
  - Soluciones:
    - Verificar conexión a internet y bloquear cortafuegos.
    - Verificar que `OPENROUTER_URL` sea accesible.
    - Asegurarse de que `OPENROUTER_API_KEY` sea correcta y no esté expirada.
    - **Alternativa:** Si `OPENROUTER_API_KEY` es un placeholder (`sk-REPLACE_WITH_YOUR_KEY`), el chatbot automáticamente usa fallback sin LLM (respuestas con herramientas locales solo).

- `A 'locale' is expected to be returned from getRequestConfig` (warning de `next-intl`):
  - No impide ejecución, pero indica que el plugin/uso de `getRequestConfig` está usando el parámetro `locale` que está deprecado. No es necesario para ejecutar localmente, pero es buena idea actualizar a `await requestLocale` según la documentación de `next-intl`.

**Notas de seguridad y buenas prácticas**

- Nunca subir `.env.local` con claves reales al control de versiones. Añade secrets a `.gitignore` (ya suele estar ignorado).
- Reemplazar claves públicas/privadas antes de compartir el repo.

**Cómo probar el chatbot sin interfaz web**

El proyecto incluye un script de humo (smoke test) para probar el chatbot rápidamente desde terminal:

```bash
npm run smoke:chat "¿Quién es Pikachu?"
```

El script:
- POSTea a `http://localhost:3000/api/chat`
- Envia un sessionId único
- Retorna status HTTP y respuesta JSON

Personalización:

```bash
# Cambiar URL del servidor
SMOKE_URL=http://otro-host:3000/api/chat npm run smoke:chat "Mensaje"

# Con clave de OpenRouter
OPENROUTER_API_KEY=sk-or-v1-xxx npm run smoke:chat "Mensaje"

# Con DEBUG habilitado
DEBUG=true npm run smoke:chat "Mensaje"
```

---

**Cómo desactivar temporalmente la funcionalidad de chat**

Si tu compañero no tiene las claves o no quiere conectar con OpenRouter/Ollama:

- No crear `.env.local` con `OPENROUTER_API_KEY` (o dejar el placeholder). Ten en cuenta que:
  - El endpoint de chat **sigue funcionando** — retorna respuestas basadas en herramientas locales.
  - No se hace fetch a OpenRouter (sin clave).
  - `summarizeToolResults()` genera resumen local en lugar de pedirlo al LLM.
- Alternativa para respuestas LLM completas: en `lib/chat/llm.ts` y `lib/chat/ollama.ts` se puede modificar temporalmente el código para retornar un texto mock en vez de hacer fetch (útil para desarrollo rápido). Ejemplo rápido:

```ts
// reemplazar temporalmente la llamada real por un mock
export async function llmChat(...) {
  return 'Respuesta mock de LLM para desarrollo';
}
```

Sin embargo, **ya hay un fallback automático** — si usas el placeholder en `.env.local`, no necesitas cambiar código.

**Información adicional**

- Next.js sirve en `http://localhost:3000` por defecto.
- Si se necesitan versiones concretas de Node, usar `nvm` o `volta` para fijar entorno.
- Para información detallada sobre la arquitectura del chatbot, intenciones, herramientas y mejoras, consulta [TRABAJO_REALIZADO.md](TRABAJO_REALIZADO.md).
- El fallback sin LLM (`summarizeToolResults()`) genera respuestas legibles a partir de herramientas PokeAPI locales — útil para desarrollo y pruebas sin API key.

---

Si quieres, puedo:

- Eliminar o sanear la clave que hay en `.env.local` en el repositorio para que no se vea la API key actual.
- Crear un `.env.example` sin valores secretos que puedas compartir con el equipo.
- Automatizar un pequeño script `start-dev.sh` o `README` con pasos rápidos.

Dime cuál prefieres y lo implemento.
