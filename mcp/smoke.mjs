// Smoke check: boots the MCP server over stdio and lists tools.
// Fails if the server can't start or tools are missing. Real APP_PASSWORD
// isn't needed — tools/list doesn't hit Convex.
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const transport = new StdioClientTransport({
  command: "node",
  args: ["--env-file=.env.local", "mcp/server.mjs"],
  env: { ...process.env, APP_PASSWORD: process.env.APP_PASSWORD ?? "smoke-check" },
});
const client = new Client({ name: "smoke", version: "0" });
await client.connect(transport);
const { tools } = await client.listTools();
if (tools.length !== 12) throw new Error(`expected 12 tools, got ${tools.length}`);
console.log(`ok — ${tools.length} tools: ${tools.map((t) => t.name).join(", ")}`);
await client.close();
