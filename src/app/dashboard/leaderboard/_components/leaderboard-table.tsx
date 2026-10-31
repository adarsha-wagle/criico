import { RoleBadge } from "@/components/reusables/role-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatNumber, formatScore } from "@/lib/format";
import type { Leaderboard } from "@/lib/queries/leaderboard";
import { cn } from "@/lib/utils";

/**
 * Server component. `compact` hides stat columns for small previews
 * (home page, overview). The full version spells out how each score adds up.
 */
export function LeaderboardTable({
  entries,
  compact = false,
}: {
  entries: Leaderboard;
  compact?: boolean;
}) {
  return (
    <div className="panel overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-14">Rank</TableHead>
            <TableHead>Player</TableHead>
            {!compact && (
              <>
                <TableHead className="hidden text-right sm:table-cell">
                  Matches
                </TableHead>
                <TableHead className="text-right">Runs</TableHead>
                <TableHead className="text-right">Wickets</TableHead>
                <TableHead className="hidden lg:table-cell">
                  How the score adds up
                </TableHead>
              </>
            )}
            <TableHead className="text-right">Impact</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map(({ rank, player, impact }) => (
            <TableRow key={player.id}>
              <TableCell
                className={cn(
                  "font-display text-base font-semibold tabular-nums",
                  rank <= 3 ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {rank}
              </TableCell>
              <TableCell>
                <div className="flex flex-col gap-1.5">
                  <span className="font-medium">{player.name}</span>
                  <RoleBadge role={player.role} />
                </div>
              </TableCell>
              {!compact && (
                <>
                  <TableCell className="hidden text-right sm:table-cell">
                    {formatNumber(player.matchesPlayed)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatNumber(player.totalRuns)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatNumber(player.totalWickets)}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <Breakdown impact={impact} />
                  </TableCell>
                </>
              )}
              <TableCell
                className={cn(
                  "text-right font-display text-lg font-semibold tabular-nums",
                  impact.total < 0 && "text-destructive",
                )}
              >
                {formatScore(impact.total)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

/** The score written as a sum, e.g. "180 runs + 80 wickets + 30 keeper − 50 rookie". */
function Breakdown({ impact }: { impact: Leaderboard[number]["impact"] }) {
  const exp = impact.experienceAdjustment;
  const terms = [
    { label: "runs", value: impact.runPoints },
    { label: "wickets", value: impact.wicketPoints },
    ...(impact.roleBonus ? [{ label: "keeper", value: impact.roleBonus }] : []),
    ...(exp ? [{ label: exp > 0 ? "veteran" : "rookie", value: exp }] : []),
  ];

  return (
    <span className="text-[13px] text-muted-foreground">
      {terms.map(({ label, value }, i) => (
        <span key={label}>
          {i > 0 && <span className="px-1.5">{value < 0 ? "−" : "+"}</span>}
          <span className="tabular-nums text-foreground">
            {formatScore(i > 0 ? Math.abs(value) : value)}
          </span>{" "}
          {label}
        </span>
      ))}
    </span>
  );
}
