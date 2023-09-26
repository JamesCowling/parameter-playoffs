import { query } from "./_generated/server";

export const stats = query({
  args: {},
  handler: async (ctx, args) => {
    const configs = await ctx.db.query("configs").collect();
    const stats = configs.map((config) => {
      return {
        name: config.name,
        winPct: 100 * (config.votesFor / config.totalVotes),
        totalVotes: config.totalVotes,
        votesFor: config.votesFor,
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
