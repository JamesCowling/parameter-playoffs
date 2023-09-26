import { internalMutation } from "./_generated/server";

const CONFIGS = [
  "KLMS",
  "PNDM",
  "K_EULER_ANCESTRAL",
  "DPMSolverMultistep",
  "K_EULER",
  "DDIM",
];

export const reset = internalMutation({
  args: {},
  handler: async (ctx, args) => {
    // Delete all samples.
    const samples = await ctx.db.query("samples").collect();
    for (const sample of samples) {
      await ctx.db.delete(sample._id);
    }

    // Mark all prompts as not generated.
    const prompts = await ctx.db.query("prompts").collect();
    for (const prompt of prompts) {
      await ctx.db.patch(prompt._id, { generated: false });
    }

    // Insert all config names in the database.
    for (const config of CONFIGS) {
      await ctx.db.insert("configs", {
        name: config,
        totalVotes: 0,
        votesFor: 0,
      });
    }
  },
});