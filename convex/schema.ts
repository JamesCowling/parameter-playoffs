import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // A text prompt to generate an image for.
  prompts: defineTable({
    text: v.string(),
    generated: v.boolean(), // true if SAMPLES_PER_PROMPT have been generated
  }).index("generated", ["generated"]),

  // Various values for each configurable parameter of SDXL, currently just
  // "scheduler" and "refiner".
  params: defineTable({
    name: v.string(),
    value: v.string(),
    votesFor: v.number(), // aggregated from `samples`
    totalVotes: v.number(), // aggregated from `samples`
  }).index("name", ["name"]),

  // Associative mapping from a param to a sample. Since multiple paramters are
  // used to generate a sample there will be multiple rows for each sample.
  paramSamples: defineTable({
    param: v.id("params"),
    sample: v.id("samples"),
  }).index("sample", ["sample"]),

  // An image generated for a prompt and a particular configuration of SDXL.
  samples: defineTable({
    prompt: v.id("prompts"),
    storageId: v.string(),
    votesFor: v.number(), // total wins
    totalVotes: v.number(), // total comparisons
  }).index("prompt", ["prompt"]),
});
