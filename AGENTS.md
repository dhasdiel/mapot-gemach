# mapot-gemach

Hebrew RTL tablecloth-lending gemach app. React + Vite frontend, Convex backend, Vercel hosting.

## Git workflow

- **Work on a feature branch and open a PR** — do not push straight to `main` (user preference, 2026-09-23).

## Commands

- `npm run dev` — Vite dev server
- `npm run build` — typecheck + build
- `npx convex dev` / `npx convex deploy` — dev / prod backend
- `vercel deploy --prod` — frontend deploy

## Conventions

- `ponytail:` comments mark intentional simplifications (see global rules).
- `APP_PASSWORD` and `CONVEX_URL` live in env/config only — never in source.
- Hebrew RTL end-to-end, including error strings; civil dates always paired with Hebrew dates.
- Visual system: see DESIGN.md; product context: PRODUCT.md.
