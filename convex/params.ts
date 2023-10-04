import { v } from "convex/values";
import { internalQuery, query } from "./_generated/server";
import { Doc } from "./_generated/dataModel";

// Stats on number of votes for each param.
export const stats = query({
  handler: async (ctx) => {
    // Fetch all params.
    const params = await ctx.db.query("params").collect();

    // Aggregate params by name.
    const paramsByName = new Map<string, Doc<"params">[]>();
    for (const param of params) {
      const params = paramsByName.get(param.name) || [];
      paramsByName.set(param.name, [...params, param]);
    }

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
    for (const [name, values] of paramsByName.entries()) {
      const stats = values.map((value) => {
        return {
          value: value.value,
          winPct: 100 * (value.votesFor / value.totalVotes),
          totalVotes: value.totalVotes,
          votesFor: value.votesFor,
        };
      });
      stats.sort((a, b) => {
        const winPctDiff = b.winPct - a.winPct;
        if (winPctDiff !== 0) {
          return winPctDiff;
        }
        return b.totalVotes - a.totalVotes;
      });
      statsByName.set(name, stats);
    }

    // Convert statsByName to an array of objects since Convex doesn't support
    // maps as return values.
    return Array.from(statsByName.entries()).map(([name, stats]) => ({
      name,
      stats,
    }));
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
        if (param === null) throw new Error("param not found");
        return param;
      })
    );
    return params;
  },
});

export const getBatch = internalQuery({
  args: { paramIds: v.array(v.id("params")) },
  handler: async (ctx, { paramIds }) => {
    return await Promise.all(
      paramIds.map(async (paramId) => {
        const param = await ctx.db.get(paramId);
        if (param === null) throw new Error("param not found");
        return param;
      })
    );
  },
});
