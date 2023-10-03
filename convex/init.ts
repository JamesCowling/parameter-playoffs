import { internalMutation } from "./_generated/server";

const CONFIGS = [
  "KLMS",
  "PNDM",
  "K_EULER_ANCESTRAL",
  "DPMSolverMultistep",
  "K_EULER",
  "DDIM",
];

// Delete all the stuff.
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

    // Delete all configs.
    const configs = await ctx.db.query("configs").collect();
    for (const config of configs) {
      await ctx.db.delete(config._id);
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
