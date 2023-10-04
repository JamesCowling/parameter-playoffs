import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { paginationOptsValidator } from "convex/server";
import { shuffle } from "./samples";
import { Id } from "./_generated/dataModel";

// Number of samples to generate per prompt.
export const NUM_SAMPLES = 3;

export const list = query({
  args: {},
  handler: async (ctx, args) => {
    return await ctx.db.query("prompts").collect();
  },
});

// XXX need to sort this better
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
            const params = await Promise.all(
              paramSamples.map(async (paramSample) => {
                const param = await ctx.db.get(paramSample.param);
                if (!param) throw new Error("param not found");
                return param;
              })
            );
            if (params.length == 0) throw new Error("params not found");
            return { ...sample, url, params };
          })
        );
        return { ...prompt, samples: samplesWithMetadata };
      })
    );
    return { page: promptSamples, isDone, continueCursor };
  },
});

type Param = {
  _id: Id<"params">;
  _creationTime: number;
  name: string;
  value: string;
  votesFor: number;
  totalVotes: number;
};

// TODO clean up this code
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
    }, {} as { [name: string]: Param[] });

    // Create all possible combinations of parameters.
    const values = Object.values(paramsByName);
    const combos = values.reduce((acc: Param[][], current) => {
      const temp: Param[][] = [];
      for (const entry of current) {
        for (const existing of acc) {
          temp.push([...existing, entry]);
        }
      }
      return acc.length ? temp : current.map((param) => [param]);
    }, []);

    // Take a sample of combinations.
    if (combos.length < NUM_SAMPLES) {
      throw new Error("not enough param combinations");
    }
    shuffle(combos);
    const comboBatch = combos.slice(0, NUM_SAMPLES);
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
