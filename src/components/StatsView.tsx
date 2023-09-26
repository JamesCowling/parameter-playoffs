import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export function StatsView() {
  const stats = useQuery(api.configs.stats);

  return (
    <div>
      <h3>Stats</h3>
      {stats?.map((config) => (
        <div key={config.name}>
          {config.name}: {config.winPct.toFixed(1)}%
        </div>
      ))}
    </div>
  );
}
