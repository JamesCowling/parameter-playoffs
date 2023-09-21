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

    await ctx.scheduler.runAfter(0, internal.dalle.generate, {
      prompt: text,
      promptId,
    });
    await ctx.scheduler.runAfter(0, internal.stablediffusion.generate, {
      prompt: text,
      promptId,
    });
  },
});