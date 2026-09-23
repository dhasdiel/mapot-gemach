// MCP server (stdio) exposing the gemach Convex functions as tools.
// Run: node --env-file=.env.local mcp/server.mjs
// Env: CONVEX_URL (or VITE_CONVEX_URL) + APP_PASSWORD — injected into every
// call server-side, so agents never see or supply the password.
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { ConvexHttpClient } from "convex/browser";
import { z } from "zod";

const url = process.env.CONVEX_URL ?? process.env.VITE_CONVEX_URL;
const key = process.env.APP_PASSWORD;
if (!url || !key) {
  console.error("missing env: need CONVEX_URL (or VITE_CONVEX_URL) and APP_PASSWORD");
  process.exit(1);
}

const client = new ConvexHttpClient(url);
const server = new McpServer({ name: "mapot-gemach", version: "1.0.0" });

// ponytail: results come back as JSON text, not structuredContent — agents
// read it fine; upgrade path is adding outputSchema per tool if needed.
function tool(name, description, fnName, isMutation, inputSchema) {
  server.registerTool(name, { description, inputSchema }, async (args) => {
    const call = isMutation ? client.mutation : client.query;
    const result = await call.call(client, `gemach:${fnName}`, { ...args, key });
    const text = result === undefined ? "ok" : JSON.stringify(result, null, 2);
    return { content: [{ type: "text", text }] };
  });
}

const id = (table) => z.string().describe(`Convex ${table} document id`);

tool("list_people", "List all registered people (name, phone, visitor flag, notes)", "listPeople", false, {});
tool("add_person", "Add a person; set visitor=true if they came to look but aren't borrowing yet", "addPerson", true, {
  name: z.string(),
  phone: z.string(),
  visitor: z.boolean().optional(),
  notes: z.string().optional(),
});
tool("update_person", "Update a person's name/phone/visitor flag/notes", "updatePerson", true, {
  id: id("people"),
  name: z.string(),
  phone: z.string(),
  visitor: z.boolean().optional(),
  notes: z.string().optional(),
});
tool("remove_person", "Delete a person", "removePerson", true, { id: id("people") });

tool("list_items", "List inventory items with live availability", "listItems", false, {});
tool("add_item", "Add an inventory item", "addItem", true, {
  name: z.string(), size: z.string(), color: z.string(), quantity: z.number().int(),
});
tool("update_item", "Update an inventory item", "updateItem", true, {
  id: id("items"), name: z.string(), size: z.string(), color: z.string(), quantity: z.number().int(),
});
tool("remove_item", "Delete an item (fails if on loan)", "removeItem", true, { id: id("items") });

tool("list_loans", "List all loans, newest first", "listLoans", false, {});
tool("create_loan", "Create a loan for a borrower", "createLoan", true, {
  borrowerName: z.string().describe("required, but ignored when personId is provided (pass \"\")"),
  phone: z.string().describe("required, but ignored when personId is provided (pass \"\")"),
  personId: id("people").optional().describe("registered borrower — pulls name/phone from their record"),
  items: z.array(z.object({ itemId: id("items"), qty: z.number().int() })),
  dueAt: z.number().describe("due date as epoch ms"),
  notes: z.string().optional(),
});
tool("return_loan", "Mark a loan as returned", "returnLoan", true, { id: id("loans") });
tool("remove_loan", "Delete a loan record", "removeLoan", true, { id: id("loans") });

await server.connect(new StdioServerTransport());
