# Parhle — Multi-service Project

This repository contains two related Next.js services under the same workspace. The user lands on a single homepage and selects which service to use. Each service is a self-contained Next.js app (or sub-app) inside this repository.

- Part 1 — `ai-pdf-note-taker` (already present)
- Part 2 — `next-quiz-ai` (Next.js quiz application with AI integration — planned)

---

## 1) AI PDF Note Taker

Location: `ai-pdf-note-taker/`

Summary
- Upload PDFs, extract text / embeddings, and take searchable, AI-assisted notes.
- Built with Next.js (App Router), Tailwind CSS, Clerk for auth, Convex for backend functions & DB, and shadcn/ui for components.

Key folders
- `app/` — Next App Router pages and client components
- `components/` — shared UI components
- `convex/` — Convex functions + schema and generated API
- `lib/` — utility helpers (e.g. `utils.js`)
- `public/` — static assets (logo, images)

How it works (high level)
1. User signs in (Clerk) and uploads a PDF.
2. Server-side/worker extracts text and creates embeddings (OpenAI or other embedding provider).
3. Embeddings and metadata are stored (e.g., Convex or another DB/search index).
4. UI lets users search/explore the document and ask the AI for summaries / notes.

Run locally (from repo root)
```powershell
cd ai-pdf-note-taker
npm install
# Start Next dev
npx next dev
# If using Convex functions locally in this folder
npx convex dev
```

Important environment variables (example `.env.local` in `ai-pdf-note-taker`):
```
NEXT_PUBLIC_CONVEX_URL=...  # convex url or local dev url
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...
OPENAI_API_KEY=...
```

Notes & gotchas
- Some shadcn-generated components were briefly created under a literal `@` folder. If you see import errors like `Module not found: Can't resolve '@/lib/utils'`, either set `baseUrl` in `jsconfig.json` and remove the stray `@` folder, or convert imports to relative paths. The project README inside `ai-pdf-note-taker/README.md` contains more details.
- Convex functions must be running or deployed for backend calls to succeed. Use `npx convex dev` to develop locally.

---

## 2) Next.js Quiz Application with AI (planned)

Planned location: `next-quiz-ai/` (create this folder at repo root)

Summary
- A Next.js app that serves interactive quizzes and uses AI to generate questions, provide hints, and grade open-ended answers.
- AI integration: Use OpenAI (or other LLM) via server-side functions to generate questions, decide difficulty, and evaluate answers.
- Single sign-on / auth can be shared with the PDF app using Clerk.

Key features (intended)
- Homepage shows available quiz categories and difficulty selector.
- AI-backed question generation: on-demand generation for categories/difficulty.
- AI grading & feedback: free-text answers are graded and explained by the model.
- Progress tracking: store user quiz history and scores in Convex or another backend.
- Optionally, multimodal questions (images, short audio) in future iterations.

Suggested structure
```
next-quiz-ai/
  app/
    page.js        # landing for quiz app
    quiz/[id]/page.js
  components/
  lib/
  public/
  convex/         # optional: shared convex functions or a separate folder
  README.md
```

Run locally (once created)
```powershell
cd next-quiz-ai
npm install
npx next dev
```

Environment variables
```
OPENAI_API_KEY=...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...
NEXT_PUBLIC_CONVEX_URL=... # if sharing Convex backend
```

AI design notes (short)
- Use server-side endpoints or Convex server functions to call the LLM — never from client-side directly.
- Keep prompt templates in `lib/` and separate example templates by task (generate-question, grade-answer, hint).
- Rate-limit or debounce generation endpoints to control cost.

---

## Top-level homepage (main launcher)

UX flow
- The repository should expose a single launcher homepage (e.g. root `app/page.js` in the workspace or a small static index) where the user chooses the service:
  - "AI PDF Note Taker"
  - "Quiz (AI)"
- Clicking a service navigates to that service's app route (for local development you can route to `/ai-pdf-note-taker` and `/next-quiz-ai` or mount both under a single Next app with subpaths).

Example navigation behavior
- Root index page contains two cards/links. Each link navigates to `/ai-pdf-note-taker` or `/next-quiz-ai` (or the equivalent route where the app is served).
- If you plan to host each service as a separate Next.js app, consider a tiny reverse-proxy or Nginx to serve the correct app under a single domain in production — or keep them as subfolders inside a monorepo and expose routes from a single Next app.

---

## Development tips / commands

From repo root, to run the AI PDF Note Taker:
```powershell
cd ai-pdf-note-taker
npm install
npx next dev
```

To run Convex locally (if used):
```powershell
cd ai-pdf-note-taker
npx convex dev
```

To scaffold the quiz app quickly:
```powershell
# from repo root
mkdir next-quiz-ai
cd next-quiz-ai
npx create-next-app@latest .
# then copy Tailwind/shadcn config if you want the same styling
```

## Deployment
- For simple hosting, deploy each Next app separately (Vercel / Netlify). If you want a single domain, deploy a single Next app that mounts both services as routes.
- Deploy Convex functions with `npx convex deploy`.

---

## Questions / next steps I can help with
- Move generated `@` folder components into `components/` and restore `@/` alias imports across the repo (cleanup).
- Scaffold and integrate the `next-quiz-ai` app (I can create the folder structure, a starter homepage, and AI integration examples).
- Wire shared auth (Clerk) between both services.

If you want me to create the `next-quiz-ai` scaffold now, say "scaffold quiz app" and I will create the folder, starter pages, and minimal AI call example.