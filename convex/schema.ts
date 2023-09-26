import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  prompts: defineTable({
    text: v.string(),
    generated: v.boolean(),
  }).index("generated", ["generated"]),

  configs: defineTable({
    name: v.string(),
    totalVotes: v.number(),
    votesFor: v.number(),
  }),

  samples: defineTable({
    prompt: v.id("prompts"),
    config: v.id("configs"),
    storageId: v.string(),
    totalVotes: v.number(),
    votesFor: v.number(),
  }).index("prompt", ["prompt"]),
});
