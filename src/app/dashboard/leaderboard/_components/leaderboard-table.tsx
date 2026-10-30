import { RoleBadge } from "@/components/reusables/role-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatNumber, formatScore, formatSigned } from "@/lib/format";
import type { Leaderboard } from "@/lib/queries/leaderboard";
import { cn } from "@/lib/utils";

/**
 * Server component. `compact` hides stat columns for small previews
 * (home page, overview). The full version adds the score breakdown.
 */
export function LeaderboardTable({
  entries,
  compact = false,
}: {
  entries: Leaderboard;
  compact?: boolean;
}) {
  return (
    <div className="border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted hover:bg-muted">
            <TableHead className="w-12 text-xs uppercase tracking-wide">
              Rank
            </TableHead>
            <TableHead className="text-xs uppercase tracking-wide">
              Player
            </TableHead>
            {!compact && (
              <>
                <TableHead className="hidden text-right text-xs uppercase tracking-wide sm:table-cell">
                  Matches
                </TableHead>
                <TableHead className="text-right text-xs uppercase tracking-wide">
                  Runs
                </TableHead>
                <TableHead className="text-right text-xs uppercase tracking-wide">
                  Wickets
                </TableHead>
                <TableHead className="hidden text-xs uppercase tracking-wide lg:table-cell">
                  How it adds up
                </TableHead>
              </>
            )}
            <TableHead className="text-right text-xs uppercase tracking-wide">
              Impact
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map(({ rank, player, impact }) => (
            <TableRow key={player.id}>
              <TableCell
                className={cn(
                  "font-semibold",
                  rank <= 3 ? "text-primary" : "text-muted-foreground",
                )}
              >
                {rank}
              </TableCell>
              <TableCell>
                <div className="flex flex-col gap-1">
                  <span className="font-medium">{player.name}</span>
                  <RoleBadge role={player.role} className="w-fit" />
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
                  <TableCell className="hidden text-xs text-muted-foreground lg:table-cell">
                    <Breakdown impact={impact} />
                  </TableCell>
                </>
              )}
              <TableCell
                className={cn(
                  "text-right font-semibold",
                  impact.total < 0 ? "text-destructive" : "text-foreground",
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

function Breakdown({ impact }: { impact: Leaderboard[number]["impact"] }) {
  const parts = [
    `Runs ${formatScore(impact.runPoints)}`,
    `Wickets ${formatScore(impact.wicketPoints)}`,
    impact.roleBonus ? `Keeper ${formatSigned(impact.roleBonus)}` : null,
    impact.experienceAdjustment > 0
      ? `Veteran ${formatSigned(impact.experienceAdjustment)}`
      : null,
    impact.experienceAdjustment < 0
      ? `Rookie ${formatSigned(impact.experienceAdjustment)}`
      : null,
  ].filter(Boolean);
  return <span>{parts.join(" · ")}</span>;
}
