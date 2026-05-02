# Pokédex Arcana

A modern, neomorphic Pokémon encyclopedia built with Next.js 14 (App Router), Tailwind CSS, and the PokéAPI, enhanced with an advanced LangGraph Multi-Agent system.

## Features

- 🔍 **Search** by Pokémon name or ID
- 📋 **Paginated list** of all Pokémon with official artwork
- 🗂️ **Detail modal** with tabs: Info | Stats | Story
- ✨ **Shiny toggle** on the detail view
- 🌐 **i18n** — Spanish (default) and English
- 🤖 **AI Chatbot** — Powered by LangGraph, OpenRouter, and SQLite RAG for real-time, context-aware multi-agent interactions
- 🎨 **Neomorphism** soft UI design
- ⚡ **Server-side rendering** with API route caching

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
# Copy .env.example to .env.local and add your OpenRouter API Key
cp .env.example .env.local

# 3. Run the dev server
npm run dev

# 4. Open http://localhost:3000

## Multi-Agent Architecture

The AI Chatbot features a multi-agent system using LangGraph for stateful, multi-step reasoning.

### System Components

- **Orchestrator Agent**: Analyzes user intent and routes to the appropriate executor.
- **Executor Agents**:
  - `info_agent.py`: Provides general Pokémon data.
  - `strategy_agent.py`: Handles battle strategies and comparisons.
  - `team_agent.py`: Builds balanced teams.
- **Tools**: Includes specialized tools for Pokémon data retrieval and calculations.
- **Memory**: Maintains conversation context and team state.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **UI/UX**:
  - Neomorphism design system
  - Custom soft shadows and gradients
  - Custom scrollbar styling
- **AI/LLM**:
  - LangGraph (Python)
  - OpenRouter (Models: `x-ai/grok-4.1-fast:free` or `openai/gpt-oss-20b`)
  - SQLite RAG (conversation history & team state)
- **Data**:
  - PokéAPI (REST)
- **Languages**:
  - TypeScript (Frontend)
  - Python (Backend AI)

##Architecture
app/
  [locale]/         ← i18n routing
    layout.tsx      ← fonts, providers
    page.tsx        ← SSR initial data
    globals.css     ← design tokens + utilities
  api/
    chat/           ← LangGraph agent orchestration endpoint
    pokemon/        ← REST proxy routes (list, search, detail)

components/
  layout/           ← Header, Footer, HomeClient (orchestrator)
  pokemon/          ← SearchBar, PokemonGrid, PokemonModal
  chat/             ← ChatBot UI with streaming support
  ui/               ← Pagination

lib/
  chat/             
    agents/         ← LangGraph agents (orchestrator, executor, etc.)
  pokeapi.ts        ← data-fetching service
  typeColors.ts     ← type → color mapping
  types.ts          ← TypeScript interfaces
  utils.ts          ← helpers (cn, formatters)

messages/
  es.json           ← Spanish translations
  en.json           ← English translations

Multi-Agent System Integration
The codebase integrates a robust multi-agent architecture to power the Pokédex Arcana experience:

LangGraph Orchestration — An Orchestrator agent routes queries to specialized sub-agents (e.g., info, battle analysis, counters) to minimize redundant LLM calls and improve speed.
High-Speed Inference — Uses OpenRouter to serve fast and capable LLMs, providing a stable alternative to local models for real-time chat.
RAG Data Layer — Integrates an SQLite database (pokemon.db) alongside PokeAPI to provide the agents with deep knowledge retrieval, lore, and battle statistics.
PokemonModal → Story tab — Surfaces agent-generated lore, stats analysis, and battle strategies directly in the UI.
Design System
Neomorphism tokens are in CSS custom properties (--neo, --neo-sm, --neo-inset). Colors live in tailwind.config.js under colors.arc.*. All shadows use a warm #C4C0BA / #FFFFFF palette to match the background.

**Principales cambios realizados:**
- Actualicé el feature del Chatbot para mencionar explícitamente LangGraph, OpenRouter y SQLite RAG.
- Añadí el paso para configurar el `.env.local` en el *Quick Start*, ya que ahora OpenRouter requiere una API Key.
- Añadí **LangGraph, LangChain, OpenRouter** y **SQLite** a la tabla del *Stack* tecnológico.
- Modifiqué el árbol de la arquitectura para mostrar los endpoints de chat y la carpeta de agentes de LangGraph en `lib/chat/agents/`.
- Reemplacé la sección de "Extension Points" por **Multi-Agent System Integration**, describiendo el orquestador, la inferencia de alta velocidad con OpenRouter y la integración RAG con SQLite.
