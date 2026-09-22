/// <reference types="node" />
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { ConvexError } from "convex/values";
import type { Doc } from "./_generated/dataModel";

// ponytail: shared-password auth — every call passes `key`, checked against
// APP_PASSWORD env var. Ceiling: anyone with the password has full access.
// Upgrade path: Convex Auth with real accounts.
function checkKey(key: string) {
  if (!process.env.APP_PASSWORD || key !== process.env.APP_PASSWORD) {
    throw new ConvexError("unauthorized");
  }
}

async function availableMap(ctx: { db: any }) {
  const [items, loans] = await Promise.all([
    ctx.db.query("items").collect(),
    ctx.db.query("loans").filter((q: any) => q.eq(q.field("returnedAt"), undefined)).collect(),
  ]);
  const used = new Map<string, number>();
  for (const loan of loans as Doc<"loans">[]) {
    for (const li of loan.items) {
      used.set(li.itemId, (used.get(li.itemId) ?? 0) + li.qty);
    }
  }
  return (items as Doc<"items">[]).map((item) => ({
    ...item,
    available: item.quantity - (used.get(item._id) ?? 0),
  }));
}

export const ping = query({
  args: { key: v.string() },
  handler: async (_ctx, args) => {
    checkKey(args.key);
    return true;
  },
});

export const listItems = query({
  args: { key: v.string() },
  handler: async (ctx, args) => {
    checkKey(args.key);
    return availableMap(ctx);
  },
});

export const addItem = mutation({
  args: { key: v.string(), name: v.string(), size: v.string(), color: v.string(), quantity: v.number() },
  handler: async (ctx, args) => {
    checkKey(args.key);
    if (args.quantity < 1 || !Number.isInteger(args.quantity)) {
      throw new ConvexError("invalid_quantity");
    }
    return ctx.db.insert("items", {
      name: args.name.trim(),
      size: args.size.trim(),
      color: args.color.trim(),
      quantity: args.quantity,
    });
  },
});

export const updateItem = mutation({
  args: {
    key: v.string(),
    id: v.id("items"),
    name: v.string(),
    size: v.string(),
    color: v.string(),
    quantity: v.number(),
  },
  handler: async (ctx, args) => {
    checkKey(args.key);
    if (args.quantity < 0 || !Number.isInteger(args.quantity)) {
      throw new ConvexError("invalid_quantity");
    }
    const active = await ctx.db
      .query("loans")
      .filter((q) => q.eq(q.field("returnedAt"), undefined))
      .collect();
    const outOnLoan = active
      .flatMap((l) => l.items)
      .filter((li) => li.itemId === args.id)
      .reduce((s, li) => s + li.qty, 0);
    if (args.quantity < outOnLoan) {
      throw new ConvexError("quantity_below_loaned");
    }
    await ctx.db.patch(args.id, {
      name: args.name.trim(),
      size: args.size.trim(),
      color: args.color.trim(),
      quantity: args.quantity,
    });
  },
});

export const removeItem = mutation({
  args: { key: v.string(), id: v.id("items") },
  handler: async (ctx, args) => {
    checkKey(args.key);
    const active = await ctx.db
      .query("loans")
      .filter((q) => q.eq(q.field("returnedAt"), undefined))
      .collect();
    if (active.some((l) => l.items.some((li) => li.itemId === args.id))) {
      throw new ConvexError("item_on_loan");
    }
    await ctx.db.delete(args.id);
  },
});

export const listLoans = query({
  args: { key: v.string() },
  handler: async (ctx, args) => {
    checkKey(args.key);
    const loans = await ctx.db.query("loans").collect();
    return loans.sort((a, b) => b.borrowedAt - a.borrowedAt);
  },
});

export const createLoan = mutation({
  args: {
    key: v.string(),
    borrowerName: v.string(),
    phone: v.string(),
    items: v.array(v.object({ itemId: v.id("items"), qty: v.number() })),
    dueAt: v.number(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    checkKey(args.key);
    if (!args.borrowerName.trim()) throw new ConvexError("missing_name");
    if (args.items.length === 0) throw new ConvexError("no_items");

    const avail = new Map((await availableMap(ctx)).map((i) => [i._id as string, i]));
    const lines = [];
    for (const { itemId, qty } of args.items) {
      const item = avail.get(itemId);
      if (!item) throw new ConvexError("item_not_found");
      if (!Number.isInteger(qty) || qty < 1) throw new ConvexError("invalid_quantity");
      if (qty > item.available) throw new ConvexError("not_enough_stock");
      lines.push({ itemId, label: itemLabel(item), qty });
    }
    return ctx.db.insert("loans", {
      borrowerName: args.borrowerName.trim(),
      phone: args.phone.trim(),
      items: lines,
      borrowedAt: Date.now(),
      dueAt: args.dueAt,
      notes: args.notes?.trim() || undefined,
    });
  },
});

export const returnLoan = mutation({
  args: { key: v.string(), id: v.id("loans") },
  handler: async (ctx, args) => {
    checkKey(args.key);
    await ctx.db.patch(args.id, { returnedAt: Date.now() });
  },
});

export const removeLoan = mutation({
  args: { key: v.string(), id: v.id("loans") },
  handler: async (ctx, args) => {
    checkKey(args.key);
    await ctx.db.delete(args.id);
  },
});

function itemLabel(item: Doc<"items">) {
  return [item.name, item.size, item.color].filter(Boolean).join(" · ");
}
