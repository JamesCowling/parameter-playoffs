import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function StatsTable({
  name,
  values,
}: {
  name: string;
  values: {
    value: string;
    winPct: number;
    totalVotes: number;
    votesFor: number;
  }[];
}) {
  return (
    <Table>
      <TableCaption>{name}</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Config</TableHead>
          <TableHead className="text-right">Wins</TableHead>
          <TableHead className="text-right">Comparisons</TableHead>
          <TableHead className="text-right">Win Rate</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {values.map((param) => (
          <TableRow key={param.value}>
            <TableCell className="font-medium">{param.value}</TableCell>
            <TableCell className="text-right">{param.votesFor}</TableCell>
            <TableCell className="text-right">{param.totalVotes}</TableCell>
            <TableCell className="text-right">
              {param.winPct.toFixed(1)}%
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

// Live updating summary stats.
export function StatsView() {
  const stats = useQuery(api.params.stats);
  if (!stats) return <div>Loading...</div>;

  return (
    <div>
      {stats.map((s) => (
        <StatsTable key={s.name} name={s.name} values={s.stats} />
      ))}
    </div>
  );
}
