import { query } from "./_generated/server";

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
