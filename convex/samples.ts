import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";

export const add = internalMutation({
  args: {
    prompt: v.id("prompts"),
    configName: v.string(),
    storageId: v.string(),
  },
  handler: async (ctx, { prompt, configName, storageId }) => {
    const config = await ctx.db
      .query("configs")
      .filter((q) => q.eq(q.field("name"), configName))
      .first();
    if (config === null) {
      throw new Error(`config ${configName} not found`);
    }
    await ctx.db.insert("samples", {
      prompt,
      config: config._id,
      storageId,
      totalVotes: 0,
      votesFor: 0,
    });

    // Mark prompt as generated if all configs have been sampled.
    const configs = await ctx.db.query("configs").collect();
    const samples = await ctx.db
      .query("samples")
      .withIndex("prompt", (q) => q.eq("prompt", prompt))
      .collect();
    if (samples.length >= configs.length) {
      await ctx.db.patch(prompt, { generated: true });
    }
  },
});

function shuffle(array: any[]) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

export const getBatch = query({
  args: { size: v.number() },
  handler: async (ctx, { size }) => {
    const prompts = await ctx.db
      .query("prompts")
      .withIndex("generated", (q) => q.eq("generated", true))
      .collect();
    shuffle(prompts);
    const promptBatch = prompts.slice(0, size);

    const batch = promptBatch.map(async (prompt) => {
      const samples = await ctx.db
        .query("samples")
        .withIndex("prompt", (q) => q.eq("prompt", prompt._id))
        .collect();
      shuffle(samples);
      if (samples.length < 2) throw new Error("Not enough images for prompt");
      const left = samples[0];
      const right = samples[1];
      const leftUrl = await ctx.storage.getUrl(left.storageId);
      const rightUrl = await ctx.storage.getUrl(right.storageId);
      if (leftUrl === null || rightUrl === null) {
        throw new Error("failed to get image url");
      }
      const leftConfig = await ctx.db.get(left.config);
      const rightConfig = await ctx.db.get(right.config);
      if (leftConfig === null || rightConfig === null) {
        throw new Error("failed to get config");
      }
      const ret = {
        prompt: prompt.text,
        promptId: prompt._id,
        left: leftUrl,
        leftId: left._id,
        leftConfig: leftConfig.name,
        right: rightUrl,
        rightId: right._id,
        rightConfig: rightConfig.name,
      };
      return ret;
    });
    const val = await Promise.all(batch);
    return val;
  },
});

export const vote = mutation({
  args: {
    winnerId: v.id("samples"),
    loserId: v.id("samples"),
  },
  handler: async (ctx, { winnerId, loserId }) => {
    const winner = await ctx.db.get(winnerId);
    const loser = await ctx.db.get(loserId);
    if (winner === null || loser === null) {
      throw new Error("sample not found");
    }
    if (winner.prompt !== loser.prompt) {
      throw new Error("samples do not match");
    }
    const winningConfig = await ctx.db.get(winner.config);
    const losingConfig = await ctx.db.get(loser.config);
    if (winningConfig === null || losingConfig === null) {
      throw new Error("config not found");
    }
    await ctx.db.patch(winnerId, {
      totalVotes: winner.totalVotes + 1,
      votesFor: winner.votesFor + 1,
    });
    await ctx.db.patch(loserId, { totalVotes: loser.totalVotes + 1 });
    await ctx.db.patch(winningConfig._id, {
      totalVotes: winningConfig.totalVotes + 1,
      votesFor: winningConfig.votesFor + 1,
    });
    await ctx.db.patch(losingConfig._id, {
      totalVotes: losingConfig.totalVotes + 1,
    });
  },
});
