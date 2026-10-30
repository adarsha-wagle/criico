import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import { idParamSchema } from "@/lib/validation/player";
import { PageHeader } from "@/components/reusables/page-header";
import { StatCard } from "@/components/reusables/stat-card";
import { getMatchById, TMatchDetail } from "@/lib/queries/matches";
import { RoleBadge } from "@/components/reusables/role-badge";

export const metadata: Metadata = { title: "Match" };

type Params = Promise<{ id: string }>;

const dateFmt = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "2-digit",
  month: "long",
  year: "numeric",
});
const head = "text-xs uppercase tracking-wide";

/** Scorecard for one match: result, standout performances, and both teams' players. */
export default function MatchPage({ params }: { params: Params }) {
  return (
    <>
      <Link
        href="/dashboard/matches"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary underline-offset-4 hover:underline"
      >
        <ArrowLeft className="size-4" aria-hidden />
        All matches
      </Link>
      <Suspense fallback={<MatchSkeleton />}>
        <MatchContent params={params} />
      </Suspense>
    </>
  );
}

async function MatchContent({ params }: { params: Params }) {
  const { id } = await params;
  // A malformed id would make Postgres throw; treat it as "no such match".
  if (!idParamSchema.safeParse(id).success) notFound();

  const match = await getMatchById(id);
  if (!match) notFound();

  return (
    <>
      <PageHeader
        title={`${match.teamA.name} v ${match.teamB.name}`}
        description={dateFmt.format(match.playedAt)}
      />

      <div className="grid gap-6">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard
            label="Result"
            value={resultText(match)}
            hint={statusHint(match)}
          />
          <StatCard
            label="Total runs"
            value={formatNumber(match.teamA.runs + match.teamB.runs)}
            hint={`${match.teamA.runs} and ${match.teamB.runs}`}
          />
          <StatCard
            label="Top scorer"
            value={match.topScorer ? formatNumber(match.topScorer.runs) : "0"}
            hint={match.topScorer?.name}
          />
          <StatCard
            label="Best bowling"
            value={match.bestBowler ? `${match.bestBowler.wickets} wkts` : "0"}
            hint={match.bestBowler?.name}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <TeamCard team={match.teamA} />
          <TeamCard team={match.teamB} />
        </div>
      </div>
    </>
  );
}

function TeamCard({ team }: { team: TMatchDetail["teamA"] }) {
  return (
    <section className="border bg-card">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h2 className={cn("font-semibold", team.won && "text-primary")}>
          {team.name}
        </h2>
        {team.won && (
          <span className="border border-primary px-1.5 py-0.5 text-[11px] font-medium uppercase leading-none tracking-wide text-primary">
            Winner
          </span>
        )}
      </div>

      {team.performances.length === 0 ? (
        <p className="p-4 text-sm text-muted-foreground">
          No performances recorded for this team.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="bg-muted hover:bg-muted">
              <TableHead className={head}>Player</TableHead>
              <TableHead className={cn(head, "text-right")}>Runs</TableHead>
              <TableHead className={cn(head, "text-right")}>Wickets</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {team.performances.map((p) => (
              <TableRow key={p.playerId}>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <span className="font-medium">{p.name}</span>
                    <RoleBadge role={p.role} className="w-fit" />
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  {formatNumber(p.runs)}
                </TableCell>
                <TableCell className="text-right">
                  {formatNumber(p.wickets)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow className="bg-muted hover:bg-muted">
              <TableCell className="font-semibold">Total</TableCell>
              <TableCell className="text-right font-semibold">
                {formatNumber(team.runs)}
              </TableCell>
              <TableCell className="text-right font-semibold">
                {formatNumber(team.wickets)}
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      )}
    </section>
  );
}

const resultText = (m: TMatchDetail) =>
  m.status === "completed" && m.winner
    ? `${m.winner} won`
    : m.status === "draw"
      ? "Draw"
      : "Not played";

const statusHint = (m: TMatchDetail) =>
  m.status === "completed"
    ? "Completed"
    : m.status === "draw"
      ? "No winner"
      : m.status.replace("_", " ");

function MatchSkeleton() {
  return (
    <div className="grid gap-6" aria-busy="true">
      <Skeleton className="h-14 w-2/3" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-80" />
        <Skeleton className="h-80" />
      </div>
    </div>
  );
}
