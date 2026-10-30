import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatNumber } from "@/lib/format";
import type { MatchSummary } from "@/lib/queries/matches";
import { cn } from "@/lib/utils";

const head = "text-xs uppercase tracking-wide";
const dateFmt = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

/** Server component: one row per match, newest first. */
export function MatchesTable({ matches }: { matches: MatchSummary[] }) {
  return (
    <div className="border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted hover:bg-muted">
            <TableHead className={cn(head, "w-32")}>Date</TableHead>
            <TableHead className={head}>Fixture</TableHead>
            <TableHead className={cn(head, "hidden md:table-cell")}>
              Result
            </TableHead>
            <TableHead className={cn(head, "hidden text-right sm:table-cell")}>
              Players
            </TableHead>
            <TableHead className={cn(head, "text-right")}>Runs</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {matches.map((m) => (
            <TableRow key={m.id}>
              <TableCell className="text-muted-foreground">
                {dateFmt.format(m.playedAt)}
              </TableCell>
              <TableCell>
                <div className="flex flex-col gap-0.5">
                  {/* The fixture links to the match scorecard. */}
                  <Link
                    href={`/dashboard/matches/${m.id}`}
                    className="font-medium hover:text-primary"
                  >
                    <TeamName name={m.teamA} won={m.winner === m.teamA} />
                    <span className="px-1.5 text-muted-foreground">v</span>
                    <TeamName name={m.teamB} won={m.winner === m.teamB} />
                  </Link>
                  {/* Result moves under the fixture on small screens. */}
                  <span className="text-xs text-muted-foreground md:hidden">
                    {resultText(m)}
                  </span>
                </div>
              </TableCell>
              <TableCell className="hidden md:table-cell">
                {resultText(m)}
              </TableCell>
              <TableCell className="hidden text-right sm:table-cell">
                {formatNumber(m.playerCount)}
              </TableCell>
              <TableCell className="text-right">
                {formatNumber(m.totalRuns)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function TeamName({ name, won }: { name: string; won: boolean }) {
  return (
    <span
      className={cn(
        won && "text-primary underline decoration-2 underline-offset-4",
      )}
    >
      {name}
    </span>
  );
}

const STATUS_TEXT: Record<MatchSummary["status"], string> = {
  scheduled: "Scheduled",
  in_progress: "In progress",
  completed: "Completed",
  draw: "Draw",
};

const resultText = (m: MatchSummary) =>
  m.status === "completed" && m.winner
    ? `${m.winner} won`
    : STATUS_TEXT[m.status];
