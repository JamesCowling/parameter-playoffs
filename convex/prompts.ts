import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { paginationOptsValidator } from "convex/server";

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
            const config = await ctx.db.get(sample.config);
            if (config == null) throw new Error("config not found");
            return { ...sample, url, configName: config.name };
          })
        );
        return { ...prompt, samples: samplesWithMetadata };
      })
    );
    return { page: promptSamples, isDone, continueCursor };
  },
});

export const add = mutation({
  args: { text: v.string() },
  handler: async (ctx, { text }) => {
    const promptId = await ctx.db.insert("prompts", { text, generated: false });

    const configs = await ctx.db.query("configs").collect();
    const configNames = configs.map((config) => config.name);

    await Promise.all(
      configNames.map(async (configName) => {
        await ctx.scheduler.runAfter(0, internal.stablediffusion.generate, {
          prompt: text,
          promptId,
          scheduler: configName,
        });
      })
    );
  },
});
