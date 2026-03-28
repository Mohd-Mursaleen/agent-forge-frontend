# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AgentForge is a platform for creating and managing AI agents with dynamic tool generation and vector-based knowledge management. Users create agents, attach vector tables (data with semantic search), define tasks (which auto-generate OpenAI function-calling tools via AI), and chat with agents that execute those tools.

## Monorepo Layout

- **frontend/** — Next.js 16 app (this directory)
- **backend/** — FastAPI Python app (sibling directory at `../backend`)

## Common Commands

### Frontend (Next.js)
```bash
npm run dev          # Dev server on port 3000
npm run build        # Production build
npm run start        # Production server
npm run lint         # ESLint
```

### Backend (FastAPI)
```bash
cd ../backend
python main.py       # Uvicorn server on port 8000 (reads HOST/PORT from .env)
pip install -r requirements.txt  # Install dependencies
```

No test suite exists in either project currently.

## Architecture

### Frontend

- **Framework**: Next.js 16 (App Router), React 19, TypeScript
- **Auth**: Clerk (ClerkProvider wraps app, middleware in `proxy.ts` protects routes)
- **State**: Local React state + `useAuth()` for tokens. Zustand is installed but unused.
- **Styling**: Tailwind CSS 4 with custom theme in `app/globals.css`
- **API Client**: Class-based Axios client in `lib/api.ts` — all backend calls go through this. Initialized via `hooks/use-api.ts` which injects the Clerk bearer token.
- **Key path alias**: `@/*` maps to project root

**Routing structure** (all under `app/`):
- `/dashboard` — agent overview cards
- `/agents/new` — multi-step wizard (step navigation via URL search params)
- `/agents/[id]` — agent detail with inline chat panel, vector tables, tasks, API keys, embed code
- `/tables/[id]` — records view with semantic search and CSV export
- `/chat` — dedicated chat page with agent selector sidebar

**Shared components** in `components/ui/` are Radix UI + Tailwind primitives (button, card, dialog, etc.). Page-level components (chat-window, api-key-generator, agent-form-stepper, confirm-dialog) live in `components/`.

### Backend

- **Framework**: FastAPI with Uvicorn
- **Database**: Supabase (PostgreSQL + pgvector). Schema defined in `app/db/sql_commands.py`.
- **Auth**: Clerk JWT validation via middleware (`app/middlewares/authMiddleware.py`). User isolation by user_id/org_id.
- **Rate Limiting**: Redis-backed sliding window (`app/middlewares/rate_limiter.py`) with per-tier limits.
- **LLM**: OpenAI API (gpt-4.1 for chat, text-embedding-ada-002 for embeddings)

**Request flow**: `endpoints/ -> services/ -> db/`
- Endpoints (routers) in `app/api/endpoints/` handle HTTP/WebSocket
- Services in `app/services/` contain business logic
- Database access via Supabase client in `app/db/database.py`

**Core agent execution flow** (chat):
1. `AssistantDataHandler` loads agent + active tasks + vector tables, converts tasks to OpenAI function-calling tools (cached 5 min)
2. `ChatService` sends conversation to OpenAI with tools attached
3. If OpenAI returns tool calls, `ToolExecutor` runs them:
   - **read**: semantic vector search via Supabase RPC `search_similar_records()`
   - **write**: inserts records with auto-generated embeddings
   - **API**: parses and executes cURL commands
4. Tool results are fed back to OpenAI for the final response

**Dynamic tool generation**: When a task is created, `task_service.generate_tool_definition()` prompts GPT-4o with the task description + available table schemas to produce an OpenAI-compatible function schema (stored as JSONB in the `tasks` table).

## Environment Variables

### Frontend (`.env.local`)
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`
- `NEXT_PUBLIC_API_URL` (defaults to `http://localhost:8000`)
- Clerk route config: `NEXT_PUBLIC_CLERK_SIGN_IN_URL`, `NEXT_PUBLIC_CLERK_SIGN_UP_URL`, etc.

### Backend (`.env`)
- `SUPABASE_URL`, `SUPABASE_KEY`
- `OPENAI_API_KEY`
- `REDIS_URL`
- `TEST_TOKEN` (dev auth bypass)
- `HOST`, `PORT`

## Key Patterns

- All frontend pages that fetch data are client components (`"use client"`) using `useEffect` + the API client from `useApi()` hook
- Confirmation dialogs use a custom `useConfirmDialog` hook (`components/confirm-dialog.tsx`)
- Agent creation is a multi-step form with URL param-based step tracking
- WebSocket chat endpoint authenticates via API key in query params, not JWT
- Vector records store 1536-dim OpenAI embeddings; search uses cosine similarity via pgvector
