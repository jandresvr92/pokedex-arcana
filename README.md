# Pokédex Arcana

A modern, neomorphic Pokémon encyclopedia built with Next.js 14 (App Router), Tailwind CSS, and the PokéAPI.

## Features

- 🔍 **Search** by Pokémon name or ID
- 📋 **Paginated list** of all Pokémon with official artwork
- 🗂️ **Detail modal** with tabs: Info | Stats | Story
- ✨ **Shiny toggle** on the detail view
- 🌐 **i18n** — Spanish (default) and English
- 🤖 **Chatbot placeholder** — wired up and ready for multi-agent integration
- 🎨 **Neomorphism** soft UI design
- ⚡ **Server-side rendering** with API route caching

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Run the dev server
npm run dev

# 3. Open http://localhost:3000
```

No `.env` file required — the app uses the public PokéAPI.

## Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 14 (App Router) |
| Styling | Tailwind CSS |
| Fonts | Crimson Pro (display) + DM Sans (body) |
| i18n | next-intl |
| Data | PokéAPI (https://pokeapi.co) |
| Language | TypeScript |

## Architecture

```
app/
  [locale]/         ← i18n routing
    layout.tsx      ← fonts, providers
    page.tsx        ← SSR initial data
    globals.css     ← design tokens + utilities
  api/
    pokemon/        ← REST proxy routes (list, search, detail)

components/
  layout/           ← Header, Footer, HomeClient (orchestrator)
  pokemon/          ← SearchBar, PokemonGrid, PokemonModal
  chat/             ← ChatBot (placeholder)
  ui/               ← Pagination

lib/
  pokeapi.ts        ← data-fetching service
  typeColors.ts     ← type → color mapping
  types.ts          ← TypeScript interfaces
  utils.ts          ← helpers (cn, formatters)

messages/
  es.json           ← Spanish translations
  en.json           ← English translations
```

## Multi-Agent Extension Points

The codebase is structured to grow into the Pokédex Arcana multi-agent system:

- **`/api/pokemon/`** — replace stub routes with agent orchestration calls
- **`ChatBot`** — connect `sendMessage` to a streaming multi-agent endpoint
- **Data layer** (`lib/pokeapi.ts`) — add RAG retrieval (Bulbapedia, Kaggle CSV) alongside PokeAPI
- **`PokemonModal` → Story tab** — surface agent-generated lore / battle analysis

## Design System

Neomorphism tokens are in CSS custom properties (`--neo`, `--neo-sm`, `--neo-inset`).
Colors live in `tailwind.config.js` under `colors.arc.*`.
All shadows use a warm `#C4C0BA / #FFFFFF` palette to match the background.
