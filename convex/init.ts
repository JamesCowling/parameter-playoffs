import { internalMutation } from "./_generated/server";

const DEFAULT_PARAMS = {
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
  handler: async (ctx) => {
    // Delete all samples.
    const samples = await ctx.db.query("samples").collect();
    await Promise.all(samples.map((sample) => ctx.db.delete(sample._id)));

    // Mark all prompts as not generated.
    const prompts = await ctx.db.query("prompts").collect();
    await Promise.all(
      prompts.map((prompt) => ctx.db.patch(prompt._id, { generated: false }))
    );

    // Reset all params.
    const params = await ctx.db.query("params").collect();
    await Promise.all(params.map((param) => ctx.db.delete(param._id)));
    const newParams = [];
    for (const [name, values] of Object.entries(DEFAULT_PARAMS)) {
      for (const value of values) {
        newParams.push({
          name,
          value,
          votesFor: 0,
          totalVotes: 0,
        });
      }
    }
    await Promise.all(newParams.map((param) => ctx.db.insert("params", param)));
  },
});
