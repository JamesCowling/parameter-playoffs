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

export function StatsView() {
  const stats = useQuery(api.configs.stats);

  return (
    <Table>
      <TableCaption>
        Stable-Diffusion scheduling configs ranked by pairwise vote.
      </TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Config</TableHead>
          <TableHead className="text-right">Wins</TableHead>
          <TableHead className="text-right">Comparisons</TableHead>
          <TableHead className="text-right">Win Rate</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {stats?.map((config) => (
          <TableRow>
            <TableCell className="font-medium">{config.name}</TableCell>
            <TableCell className="text-right">{config.votesFor}</TableCell>
            <TableCell className="text-right">{config.totalVotes}</TableCell>
            <TableCell className="text-right">
              {config.winPct.toFixed(1)}%
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
