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

// ponytail: Israeli-centric — empty ok, otherwise ≥9 digits after stripping
// punctuation. phoneDigits is the non-throwing form used for dedupe compares
// on stored rows (legacy data may be short).
function phoneDigits(phone: string) {
  return phone.replace(/\D/g, "");
}
function normPhone(phone: string) {
  const digits = phoneDigits(phone);
  if (digits && digits.length < 9) throw new ConvexError("invalid_phone");
  return digits;
}

const DAY = 86400000;

async function availableMap(ctx: { db: any }) {
  const [items, loans] = await Promise.all([
    ctx.db.query("items").collect(),
    ctx.db.query("loans").filter((q: any) => q.eq(q.field("returnedAt"), undefined)).collect(),
  ]);
  const used = new Map<string, number>();
  for (const loan of loans as Doc<"loans">[]) {
    for (const li of loan.items) {
      used.set(li.itemId, (used.get(li.itemId) ?? 0) + li.qty - (li.returnedQty ?? 0));
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

export const listPeople = query({
  args: { key: v.string() },
  handler: async (ctx, args) => {
    checkKey(args.key);
    const people = await ctx.db.query("people").collect();
    return people.sort((a, b) => a.name.localeCompare(b.name, "he"));
  },
});

export const addPerson = mutation({
  args: {
    key: v.string(),
    name: v.string(),
    phone: v.string(),
    visitor: v.optional(v.boolean()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    checkKey(args.key);
    const name = args.name.trim();
    if (!name) throw new ConvexError("missing_name");
    const phone = normPhone(args.phone);
    const people = await ctx.db.query("people").collect();
    if (people.some((p) => p.name === name && phoneDigits(p.phone) === phone)) {
      throw new ConvexError("duplicate_person");
    }
    return ctx.db.insert("people", {
      name,
      phone: args.phone.trim(),
      visitor: args.visitor,
      notes: args.notes?.trim() || undefined,
      createdAt: Date.now(),
    });
  },
});

export const updatePerson = mutation({
  args: {
    key: v.string(),
    id: v.id("people"),
    name: v.string(),
    phone: v.string(),
    visitor: v.optional(v.boolean()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    checkKey(args.key);
    const name = args.name.trim();
    if (!name) throw new ConvexError("missing_name");
    const phone = normPhone(args.phone);
    const people = await ctx.db.query("people").collect();
    if (
      people.some((p) => p._id !== args.id && p.name === name && phoneDigits(p.phone) === phone)
    ) {
      throw new ConvexError("duplicate_person");
    }
    await ctx.db.patch(args.id, {
      name,
      phone: args.phone.trim(),
      visitor: args.visitor,
      notes: args.notes?.trim() || undefined,
    });
  },
});

export const removePerson = mutation({
  args: { key: v.string(), id: v.id("people") },
  handler: async (ctx, args) => {
    checkKey(args.key);
    const active = await ctx.db
      .query("loans")
      .filter((q) => q.eq(q.field("returnedAt"), undefined))
      .collect();
    const holding = active.filter((l) => l.personId === args.id).length;
    if (holding > 0) throw new ConvexError(`person_on_loan:${holding}`);
    await ctx.db.delete(args.id);
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
      .reduce((s, li) => s + li.qty - (li.returnedQty ?? 0), 0);
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
    const holders = active
      .filter((l) => l.items.some((li) => li.itemId === args.id))
      .map((l) => l.borrowerName);
    if (holders.length > 0) {
      throw new ConvexError(`item_on_loan:${[...new Set(holders)].join(", ")}`);
    }
    await ctx.db.delete(args.id);
  },
});

export const listLoans = query({
  args: { key: v.string() },
  handler: async (ctx, args) => {
    checkKey(args.key);
    const loans = await ctx.db.query("loans").collect();
    // active first, soonest due on top (overdue bubble up); history newest first
    return loans.sort((a, b) => {
      const ra = a.returnedAt !== undefined;
      const rb = b.returnedAt !== undefined;
      if (ra !== rb) return ra ? 1 : -1;
      return ra ? b.returnedAt! - a.returnedAt! : a.dueAt - b.dueAt;
    });
  },
});

export const createLoan = mutation({
  args: {
    key: v.string(),
    borrowerName: v.string(),
    phone: v.string(),
    personId: v.optional(v.id("people")),
    items: v.array(v.object({ itemId: v.id("items"), qty: v.number() })),
    dueAt: v.number(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    checkKey(args.key);
    if (args.items.length === 0) throw new ConvexError("no_items");
    if (args.dueAt < new Date().setHours(0, 0, 0, 0)) {
      throw new ConvexError("due_in_past");
    }

    // registered borrower: pull name/phone from the people record and clear
    // their visitor flag — they're borrowing now
    let borrowerName = args.borrowerName.trim();
    let phone = args.phone.trim();
    if (args.personId) {
      const person = await ctx.db.get(args.personId);
      if (!person) throw new ConvexError("person_not_found");
      borrowerName = person.name;
      phone = person.phone;
      if (person.visitor) await ctx.db.patch(args.personId, { visitor: false });
    }
    if (!borrowerName) throw new ConvexError("missing_name");

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
      borrowerName,
      phone,
      personId: args.personId,
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
    const loan = await ctx.db.get(args.id);
    if (!loan) throw new ConvexError("loan_not_found");
    await ctx.db.patch(args.id, {
      returnedAt: Date.now(),
      items: loan.items.map((li) => ({ ...li, returnedQty: li.qty })),
    });
  },
});

// partial return: one unit of one item back at the door; the loan closes
// itself when every line is fully returned
export const returnItemUnit = mutation({
  args: { key: v.string(), id: v.id("loans"), itemId: v.id("items") },
  handler: async (ctx, args) => {
    checkKey(args.key);
    const loan = await ctx.db.get(args.id);
    if (!loan) throw new ConvexError("loan_not_found");
    if (loan.returnedAt !== undefined) throw new ConvexError("already_returned");
    const items = loan.items.map((li) =>
      li.itemId === args.itemId
        ? { ...li, returnedQty: Math.min(li.qty, (li.returnedQty ?? 0) + 1) }
        : li
    );
    const allBack = items.every((li) => (li.returnedQty ?? 0) >= li.qty);
    await ctx.db.patch(args.id, {
      items,
      ...(allBack ? { returnedAt: Date.now() } : {}),
    });
  },
});

// mis-tap recovery: move a returned loan back to active
export const unreturnLoan = mutation({
  args: { key: v.string(), id: v.id("loans") },
  handler: async (ctx, args) => {
    checkKey(args.key);
    const loan = await ctx.db.get(args.id);
    if (!loan || loan.returnedAt === undefined) throw new ConvexError("not_returned");
    await ctx.db.patch(args.id, {
      returnedAt: undefined,
      items: loan.items.map((li) => ({ ...li, returnedQty: 0 })),
    });
  },
});

// the common hallway request: "שבוע נוסף". Extends from today when the
// loan is already overdue — +7d off a stale date would stay overdue.
export const extendLoan = mutation({
  args: { key: v.string(), id: v.id("loans") },
  handler: async (ctx, args) => {
    checkKey(args.key);
    const loan = await ctx.db.get(args.id);
    if (!loan) throw new ConvexError("loan_not_found");
    if (loan.returnedAt !== undefined) throw new ConvexError("already_returned");
    const dueAt = Math.max(loan.dueAt, Date.now()) + 7 * DAY;
    await ctx.db.patch(args.id, { dueAt });
    return dueAt;
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
