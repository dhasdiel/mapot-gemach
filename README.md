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

## MCP server (agent control)

`mcp/server.mjs` exposes every gemach function as MCP tools over stdio
(`list_people`, `add_item`, `create_loan`, `return_loan`, …), so an agent
can operate the app. The password is injected server-side from
`APP_PASSWORD` — agents never see it.

Add it to the agent's MCP config (Claude Code / Desktop, Cursor, etc.):

```json
{
  "mcpServers": {
    "mapot-gemach": {
      "command": "node",
      "args": ["--env-file=.env.local", "mcp/server.mjs"],
      "cwd": "/path/to/mapot-gemach",
      "env": { "APP_PASSWORD": "<password>" }
    }
  }
}
```

Or for Claude Code: `claude mcp add mapot-gemach --env APP_PASSWORD=<password> -- node --env-file=.env.local mcp/server.mjs`

Check it works: `npm run mcp:check`

## Deploy

```bash
npx convex deploy          # push functions to prod deployment
vercel --prod              # static frontend; set VITE_CONVEX_URL to the prod convex URL
```
