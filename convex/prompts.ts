import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";

export const list = query({
  args: {},
  handler: async (ctx, args) => {
    return await ctx.db.query("prompts").collect();
  },
});

export const add = mutation({
  args: { text: v.string() },
  handler: async (ctx, { text }) => {
    const promptId = await ctx.db.insert("prompts", { text, generated: false });

    const models = await ctx.db.query("models").collect();
    const modelNames = models.map((model) => model.name);

    await Promise.all(
      modelNames.map(async (modelName) => {
        console.log(modelName);
        await ctx.scheduler.runAfter(0, internal.stablediffusion.generate, {
          prompt: text,
          promptId,
          scheduler: modelName,
        });
      })
    );
  },
});
