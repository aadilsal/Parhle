# AI PDF Note Taker

A small Next.js + Convex + Clerk demo that lets you upload PDFs and take notes. This README covers how to set up, run, and troubleshoot the project locally on Windows (PowerShell). It also includes a few project-specific notes noticed while working in the repository.

## Quick overview

- Framework: Next.js (App Router)
- DB / backend: Convex (functions + schema in `convex/`)
- Auth: Clerk (`@clerk/nextjs`) used in pages/components
- UI: Tailwind + shadcn components (some generated under a literal `@` folder in this repo)

Top-level layout:
- `app/` — Next app (pages, layouts, client components)
- `components/` — shared components (UI primitives)
- `convex/` — Convex functions, schema, and generated API
- `public/` — static assets like `logo.jpg`
- `lib/` — small utilities (e.g. `utils.js`)

## Prerequisites

- Node.js >= 16 (recommended 18+)
- npm (or yarn/pnpm)
- PowerShell (Windows) — example commands below use PowerShell syntax

## Environment variables

Create a `.env.local` file in the project root (not checked in) with values similar to:

```
NEXT_PUBLIC_CONVEX_URL=https://your-project.convex.cloud
# Clerk variables (if using Clerk auth)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_xxx
CLERK_SECRET=sk_xxx
```

Adjust required variables to match your setup.

## Install & run (development)

From the project root in PowerShell:

```powershell
# Install deps
npm install

# Start Next dev server
npx next dev
```

Open http://localhost:3000.

If you use Convex functions locally, run Convex dev in a separate terminal:

```powershell
npx convex dev
```

If you add new Convex functions or change schema, you may need to deploy or run `npx convex dev` so the server has the latest functions.

## Build (production)

```powershell
npm run build
npm start
```

## Common troubleshooting

1. Image not showing
   - Ensure the file exists in `public/` and the `src` matches the filename/casing (e.g. `/logo.jpg`).
   - Check Chrome DevTools -> Network for 404s.
   - As a quick debug, try a plain `<img src="/logo.jpg" />` instead of `next/image`.

2. Module not found for `@/` imports
   - `jsconfig.json` should contain a `baseUrl` + `paths` mapping. This repo has `jsconfig.json` but some tools may have created a literal directory named `@` (e.g. `@/components/...` ended up under `@/` on disk). If you see confusing resolution errors, two options:
     - Quick fix (robust): change the failing import to a relative path (example: `import { Button } from '../../components/ui/button'`).
     - Cleaner project fix (recommended): move files from the literal `@` directory into `components/` and restore `@/` alias imports, then restart the dev server.

   Example PowerShell commands to move files out of a literal `@` folder into `components` (run from repo root):

```powershell
# Move UI components into the normal components folder (make sure destination exists)
Move-Item -Path .\@\components\ui\* -Destination .\components\ui\ -Force
# Remove the empty literal @ folder if it's no longer needed
Remove-Item -LiteralPath .\@ -Recurse -Force
```

After moving, restart the dev server.

3. Convex errors (function not found)
   - Start `npx convex dev` or deploy your Convex functions with `npx convex deploy`.
   - Ensure function names (and file names) match how you import them from the generated API (e.g. `api.user.createuser` vs `api.use.createUser`).

4. Hydration warnings
   - These often come from differences between server-rendered HTML and client-side rendering (date/random values, or DOM mutations by browser extensions). Verify you don't call browser-only code during SSR.

## Notes added while working in this repo

- There was a literal folder named `@` created by the shadcn tool. That can cause alias confusion since imports like `@/lib/utils` may resolve to the `@` directory on disk. I fixed some imports by switching to relative paths; you can also move the generated files into `components/` and keep `@/` imports.
- Convex schema and functions live in `convex/`. If you see `MissingSchemaExportError` or `defineTable is not defined`, ensure `defineTable` is imported in `convex/schema.js` and that schema file has a default export using `defineSchema`.

## Useful commands summary

```powershell
npm install
npx next dev
npx convex dev        # run Convex locally
npx convex deploy     # deploy convex functions
npm run build
npm start
```

## If you want help

Tell me what you'd like to do next — I can:
- Move the `@`-folder components into `components/` and restore `@/` alias imports across the repo.
- Convert a specific component to use a plain `<img>` for debugging.
- Add a small script to validate Convex functions and schema before running.

---
Generated on October 1, 2025 — local instructions assume Windows PowerShell.
