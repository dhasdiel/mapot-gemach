import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  people: defineTable({
    name: v.string(),
    phone: v.string(),
    createdAt: v.number(),
  }),
  items: defineTable({
    name: v.string(),
    size: v.string(),
    color: v.string(),
    quantity: v.number(),
  }),
  loans: defineTable({
    borrowerName: v.string(),
    phone: v.string(),
    items: v.array(
      v.object({
        itemId: v.id("items"),
        label: v.string(), // snapshot so history survives item deletion
        qty: v.number(),
      })
    ),
    borrowedAt: v.number(),
    dueAt: v.number(),
    returnedAt: v.optional(v.number()),
    notes: v.optional(v.string()),
  }).index("by_returned", ["returnedAt"]),
});
