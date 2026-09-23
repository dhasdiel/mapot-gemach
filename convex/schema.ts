import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  people: defineTable({
    name: v.string(),
    phone: v.string(),
    visitor: v.optional(v.boolean()), // came to look, will borrow next time
    notes: v.optional(v.string()),
    createdAt: v.number(),
  }),
  items: defineTable({
    name: v.string(),
    size: v.string(),
    color: v.string(),
    quantity: v.number(),
    photoId: v.optional(v.id("_storage")),
  }),
  loans: defineTable({
    borrowerName: v.string(),
    phone: v.string(),
    personId: v.optional(v.id("people")),
    items: v.array(
      v.object({
        itemId: v.id("items"),
        label: v.string(), // snapshot so history survives item deletion
        qty: v.number(),
        returnedQty: v.optional(v.number()), // partial returns at the door
      })
    ),
    borrowedAt: v.number(),
    dueAt: v.number(),
    returnedAt: v.optional(v.number()),
    notes: v.optional(v.string()),
  }).index("by_returned", ["returnedAt"]),
  // visitors register interest in an out-of-stock cloth from the public catalog
  waitlist: defineTable({
    itemId: v.id("items"),
    name: v.string(),
    phone: v.string(),
    createdAt: v.number(),
  }).index("by_item", ["itemId"]),
});
