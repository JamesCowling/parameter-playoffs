import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { paginationOptsValidator } from "convex/server";
import { SAMPLES_PER_PROMPT } from "./samples";
import { Doc } from "./_generated/dataModel";
import { shuffle } from "./utils";

// Paginate over prompts with their samples and parameters.
export const listWithSamples = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    const { page, isDone, continueCursor } = await ctx.db
      .query("prompts")
      .order("desc")
      .paginate(args.paginationOpts);

    const promptSamples = await Promise.all(
      page.map(async (prompt) => {
        const samples = await ctx.db
          .query("samples")
          .withIndex("prompt", (q) => q.eq("prompt", prompt._id))
          .collect();

        const samplesWithMetadata = await Promise.all(
          samples.map(async (sample) => {
            const url = await ctx.storage.getUrl(sample.storageId);
            const paramSamples = await ctx.db
              .query("paramSamples")
              .withIndex("sample", (q) => q.eq("sample", sample._id))
              .collect();
            if (paramSamples.length == 0)
              throw new Error("paramSamples not found");

            const params = await Promise.all(
              paramSamples.map(async (paramSample) => {
                const param = await ctx.db.get(paramSample.param);
                if (!param) throw new Error("param not found");
                return param;
              })
            );

            return { ...sample, url, params };
          })
        );
        return { ...prompt, samples: samplesWithMetadata };
      })
    );
    return { page: promptSamples, isDone, continueCursor };
  },
});

// Add a new prompt and schedule generating some random samples for it.
export const add = mutation({
  args: { text: v.string() },
  handler: async (ctx, { text }) => {
    // Insert a new prompt.
    const promptId = await ctx.db.insert("prompts", { text, generated: false });

    // Fetch and group parameters by name.
    const params = await ctx.db.query("params").collect();
    const paramsByName = params.reduce((acc, param) => {
      if (!acc[param.name]) acc[param.name] = [];
      acc[param.name].push(param);
      return acc;
    }, {} as { [name: string]: Doc<"params">[] });

    // Create all possible combinations of parameters.
    const values = Object.values(paramsByName);
    const combos = values.reduce((acc, current) => {
      return acc.length
        ? acc.flatMap((existing) =>
            current.map((param) => [...existing, param])
          )
        : current.map((param) => [param]);
    }, [] as Doc<"params">[][]);

    // Take a sample of combinations.
    if (combos.length < SAMPLES_PER_PROMPT) {
      throw new Error("not enough param combinations");
    }
    shuffle(combos);
    const comboBatch = combos.slice(0, SAMPLES_PER_PROMPT);
    const comboIdBatch = comboBatch.map((combo) =>
      combo.map((param) => param._id)
    );

    // Schedule a job to generate a sample for each combination.
    await Promise.all(
      comboIdBatch.map(async (paramIds) => {
        await ctx.scheduler.runAfter(0, internal.stablediffusion.generate, {
          prompt: text,
          promptId,
          paramIds,
        });
      })
    );
  },
});
