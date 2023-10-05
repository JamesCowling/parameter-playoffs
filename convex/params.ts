import { v } from "convex/values";
import { internalQuery, query } from "./_generated/server";
import { Doc } from "./_generated/dataModel";

// Fetch stats on number of votes for each param.
export const getStats = query({
  handler: async (ctx) => {
    const params = await ctx.db.query("params").collect();

    // Aggregate params by name.
    const paramsByName = params.reduce((acc, param) => {
      if (!acc.has(param.name)) {
        acc.set(param.name, []);
      }
      (acc.get(param.name) as Doc<"params">[]).push(param);
      return acc;
    }, new Map<string, Doc<"params">[]>());

    // Compute stats for each param.
    const statsByName = new Map<
      string,
      {
        value: string;
        winPct: number;
        totalVotes: number;
        votesFor: number;
      }[]
    >();
    paramsByName.forEach((values, name) => {
      const stats = values.map((value) => {
        return {
          value: value.value,
          winPct: 100 * (value.votesFor / value.totalVotes),
          totalVotes: value.totalVotes,
          votesFor: value.votesFor,
        };
      });
      stats.sort((a, b) => b.winPct - a.winPct || b.totalVotes - a.totalVotes);
      statsByName.set(name, stats);
    });

    // Convex doesn't currently support maps as return values.
    return Array.from(statsByName).map(([name, stats]) => ({ name, stats }));
  },
});

// Return all the parameters for a given sample.
export const getForSample = query({
  args: { sample: v.id("samples") },
  handler: async (ctx, { sample }) => {
    const paramSamples = await ctx.db
      .query("paramSamples")
      .withIndex("sample", (q) => q.eq("sample", sample))
      .collect();
    const params = await Promise.all(
      paramSamples.map(async (paramSample) => {
        const param = await ctx.db.get(paramSample.param);
        if (!param) throw new Error("param not found");
        return param;
      })
    );
    return params;
  },
});

// Get parameter documents by ids.
export const getForIds = internalQuery({
  args: { ids: v.array(v.id("params")) },
  handler: async (ctx, { ids }) => {
    return await Promise.all(
      ids.map(async (id) => {
        const param = await ctx.db.get(id);
        if (!param) throw new Error("param not found");
        return param;
      })
    );
  },
});
