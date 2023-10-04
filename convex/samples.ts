import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import { getForSample as getParams } from "./params";
import { NUM_SAMPLES } from "./prompts";

export const add = internalMutation({
  args: {
    prompt: v.id("prompts"),
    params: v.array(v.id("params")),
    storageId: v.string(),
  },
  handler: async (ctx, { prompt, params, storageId }) => {
    const sample = await ctx.db.insert("samples", {
      prompt,
      storageId,
      totalVotes: 0,
      votesFor: 0,
    });
    for (const param of params) {
      await ctx.db.insert("paramSamples", { param, sample });
    }

    // Mark prompt as generated if all configs have been sampled.
    const samples = await ctx.db
      .query("samples")
      .withIndex("prompt", (q) => q.eq("prompt", prompt))
      .collect();
    if (samples.length >= NUM_SAMPLES) {
      await ctx.db.patch(prompt, { generated: true });
    }
  },
});

export function shuffle(array: any[]) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

// Fetch a set of random prompts and two random samples for each prompt.
export const getBatch = query({
  args: { size: v.number() },
  handler: async (ctx, { size }) => {
    // Pick a set of random prompts.
    const prompts = await ctx.db
      .query("prompts")
      .withIndex("generated", (q) => q.eq("generated", true))
      .collect();
    shuffle(prompts);
    const promptBatch = prompts.slice(0, size);

    // For each prompt pick a random pair of samples.
    return await Promise.all(
      promptBatch.map(async (prompt) => {
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
        const leftParams = await getParams(ctx, { sample: left._id });
        const rightParams = await getParams(ctx, { sample: right._id });
        if (leftParams.length === 0 || rightParams.length === 0) {
          throw new Error("failed to get params");
        }

        const ret = {
          prompt: prompt.text,
          left: { sample: left._id, url: leftUrl, params: leftParams },
          right: { sample: right._id, url: rightUrl, params: rightParams },
        };
        return ret;
      })
    );
  },
});

// XXX i shouldn't increment win count for a param that isn't varied in a comparison
// Increment votesFor for the winning sample and all its params. Increment
// totalVotes for both samples and all their params.
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
    const winnerParams = await getParams(ctx, { sample: winner._id });
    const loserParams = await getParams(ctx, { sample: loser._id });
    if (winnerParams.length === 0 || loserParams.length === 0) {
      throw new Error("failed to get params");
    }
    await ctx.db.patch(winnerId, {
      totalVotes: winner.totalVotes + 1,
      votesFor: winner.votesFor + 1,
    });
    await ctx.db.patch(loserId, { totalVotes: loser.totalVotes + 1 });
    for (const param of winnerParams) {
      await ctx.db.patch(param._id, {
        totalVotes: param.totalVotes + 1,
        votesFor: param.votesFor + 1,
      });
    }
    for (const param of loserParams) {
      await ctx.db.patch(param._id, { totalVotes: param.totalVotes + 1 });
    }
  },
});
