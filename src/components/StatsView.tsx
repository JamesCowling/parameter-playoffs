import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export function StatsView() {
  const stats = useQuery(api.models.stats);

  return (
    <div>
      <h3>Stats</h3>
      {stats?.map((model) => (
        <div key={model.name}>
          {model.name}: {model.winPct.toFixed(1)}%
        </div>
      ))}
    </div>
  );
}
