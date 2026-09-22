# גמ״ח מפות (mapot-gemach)

ניהול גמ״ח מפות: מלאי מפות + מעקב השאלות (מי לקח, מתי להחזיר).

## Tech

- React + Vite (frontend, Hebrew RTL)
- Convex (database + backend functions)

## Dev

```bash
npm install
npx convex dev   # terminal 1 — local backend on :3210
npm run dev      # terminal 2 — vite on :5173
```

App password is stored in the Convex deployment env var `APP_PASSWORD`:

```bash
npx convex env set APP_PASSWORD <password>
```

## Deploy

```bash
npx convex deploy          # push functions to prod deployment
vercel --prod              # static frontend; set VITE_CONVEX_URL to the prod convex URL
```
