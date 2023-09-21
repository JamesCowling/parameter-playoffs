import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  prompts: defineTable({
    text: v.string(),
    generated: v.boolean(),
  }).index("generated", ["generated"]),

  models: defineTable({
    name: v.string(),
    totalVotes: v.number(),
    votesFor: v.number(),
  }),

  samples: defineTable({
    prompt: v.id("prompts"),
    model: v.id("models"),
    storageId: v.string(),
    totalVotes: v.number(),
    votesFor: v.number(),
  }).index("prompt", ["prompt"]),
});
