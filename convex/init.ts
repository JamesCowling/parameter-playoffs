import { internalMutation } from "./_generated/server";

const PARAMS = {
  scheduler: [
    "DDIM",
    "DPMSolverMultistep",
    "HeunDiscrete",
    "KarrasDPM",
    "K_EULER_ANCESTRAL",
    "K_EULER",
    "PNDM",
  ],
  refiner: ["no_refiner", "expert_ensemble_refiner", "base_image_refiner"],
};

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

    // Reset all params.
    const params = await ctx.db.query("params").collect();
    for (const param of params) {
      await ctx.db.delete(param._id);
    }
    for (const [name, values] of Object.entries(PARAMS)) {
      for (const value of values) {
        await ctx.db.insert("params", {
          name,
          value,
          votesFor: 0,
          totalVotes: 0,
        });
      }
    }
  },
});
