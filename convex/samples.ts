import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import { getForSample as getParams } from "./params";
import { shuffle } from "./utils";

// Number of samples to generate per prompt.
export const SAMPLES_PER_PROMPT = 3;

// Add sample with the given params and prompt.
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
    await Promise.all(
      params.map((param) => ctx.db.insert("paramSamples", { param, sample }))
    );

    // Mark prompt as generated if all configs have been sampled.
    const samples = await ctx.db
      .query("samples")
      .withIndex("prompt", (q) => q.eq("prompt", prompt))
      .collect();
    if (samples.length >= SAMPLES_PER_PROMPT) {
      await ctx.db.patch(prompt, { generated: true });
    }
  },
});

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
        if (samples.length < 2) throw new Error("Not enough images for prompt");
        shuffle(samples);

        const left = samples[0];
        const leftUrl = await ctx.storage.getUrl(left.storageId);
        const leftParams = await getParams(ctx, { sample: left._id });

        const right = samples[1];
        const rightUrl = await ctx.storage.getUrl(right.storageId);
        const rightParams = await getParams(ctx, { sample: right._id });

        if (leftUrl === null || rightUrl === null) {
          throw new Error("failed to get image url");
        }
        if (leftParams.length === 0 || rightParams.length === 0) {
          throw new Error("failed to get params");
        }

        return {
          prompt: prompt.text,
          left: { sample: left._id, url: leftUrl, params: leftParams },
          right: { sample: right._id, url: rightUrl, params: rightParams },
        };
      })
    );
  },
});

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

    // XXX i shouldn't increment win count for a param that isn't varied in a comparison

    await Promise.all(
      winnerParams.map((param) =>
        ctx.db.patch(param._id, {
          totalVotes: param.totalVotes + 1,
          votesFor: param.votesFor + 1,
        })
      )
    );
    await Promise.all(
      loserParams.map((param) =>
        ctx.db.patch(param._id, {
          totalVotes: param.totalVotes + 1,
        })
      )
    );
  },
});
