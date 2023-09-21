import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";

export const getPrompts = query({
  args: {},
  handler: async (ctx, args) => {
    return await ctx.db.query("prompts").collect();
  },
});

export const add = mutation({
  args: { text: v.string() },
  handler: async (ctx, { text }) => {
    const promptId = await ctx.db.insert("prompts", { text, generated: false });

    // Just spawn a bunch of OpenAI image generations for now.
    await ctx.scheduler.runAfter(0, internal.openai.addSample, {
      prompt: text,
      promptId,
    });
    await ctx.scheduler.runAfter(0, internal.openai.addSample, {
      prompt: text,
      promptId,
    });
    await ctx.scheduler.runAfter(0, internal.openai.addSample, {
      prompt: text,
      promptId,
    });
  },
});
