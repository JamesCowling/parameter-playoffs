import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";

export const stats = query({
  args: {},
  handler: async (ctx, args) => {
    const models = await ctx.db.query("models").collect();
    const stats = models.map((model) => {
      return {
        name: model.name,
        winPct: 100 * (model.votesFor / model.totalVotes),
        totalVotes: model.totalVotes,
        votesFor: model.votesFor,
      };
    });
    stats.sort((a, b) => {
      const winPctDiff = b.winPct - a.winPct;
      if (winPctDiff !== 0) {
        return winPctDiff;
      }
      return b.totalVotes - a.totalVotes;
    });
    return stats;
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
