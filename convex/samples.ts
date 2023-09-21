import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";

export const add = internalMutation({
  args: {
    prompt: v.id("prompts"),
    modelName: v.string(),
    storageId: v.string(),
  },
  handler: async (ctx, { prompt, modelName, storageId }) => {
    const model = await ctx.db
      .query("models")
      .filter((q) => q.eq(q.field("name"), modelName))
      .first();
    if (model === null) {
      throw new Error(`model ${modelName} not found`);
    }
    await ctx.db.insert("samples", {
      prompt,
      model: model._id,
      storageId,
      totalVotes: 0,
      votesFor: 0,
    });

    // Mark prompt as generated if all models have been sampled.
    const models = await ctx.db.query("models").collect();
    const samples = await ctx.db
      .query("samples")
      .withIndex("prompt", (q) => q.eq("prompt", prompt))
      .collect();
    if (samples.length >= models.length) {
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

// TODO change this to be stable for a session so you get to see all the prompts
export const getBatch = query({
  args: {},
  handler: async (ctx, args) => {
    const prompts = await ctx.db
      .query("prompts")
      .withIndex("generated", (q) => q.eq("generated", true))
      .collect();
    shuffle(prompts);
    const promptBatch = prompts.slice(0, 10);

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
      const leftModel = await ctx.db.get(left.model);
      const rightModel = await ctx.db.get(right.model);
      if (leftModel === null || rightModel === null) {
        throw new Error("failed to get model");
      }
      const ret = {
        prompt: prompt.text,
        promptId: prompt._id,
        left: leftUrl,
        leftId: left._id,
        leftModel: leftModel.name,
        right: rightUrl,
        rightId: right._id,
        rightModel: rightModel.name,
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
    const winningModel = await ctx.db.get(winner.model);
    const losingModel = await ctx.db.get(loser.model);
    if (winningModel === null || losingModel === null) {
      throw new Error("model not found");
    }
    await ctx.db.patch(winnerId, {
      totalVotes: winner.totalVotes + 1,
      votesFor: winner.votesFor + 1,
    });
    await ctx.db.patch(loserId, { totalVotes: loser.totalVotes + 1 });
    await ctx.db.patch(winningModel._id, {
      totalVotes: winningModel.totalVotes + 1,
      votesFor: winningModel.votesFor + 1,
    });
    await ctx.db.patch(losingModel._id, {
      totalVotes: losingModel.totalVotes + 1,
    });
  },
});
