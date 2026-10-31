import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, Pencil } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
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
import { getSession } from "@/lib/jwt";
import { idParamSchema } from "@/lib/validation/player";
import { PageHeader } from "@/components/reusables/page-header";
import { StatCard, StatGrid } from "@/components/reusables/stat-card";
import { getMatchById, TMatchDetail } from "@/lib/queries/matches";
import { RoleBadge } from "@/components/reusables/role-badge";

export const metadata: Metadata = { title: "Match" };

type Params = Promise<{ id: string }>;

const dateFmt = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "numeric",
  month: "long",
  year: "numeric",
});

/** Scorecard for one match: result, standout performances, and both teams' players. */
export default function MatchPage({ params }: { params: Params }) {
  return (
    <>
      <Link
        href="/dashboard/matches"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
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

  const [match, session] = await Promise.all([getMatchById(id), getSession()]);
  if (!match) notFound();

  const playerCount =
    match.teamA.performances.length + match.teamB.performances.length;

  return (
    <>
      <PageHeader
        title={`${match.teamA.name} v ${match.teamB.name}`}
        description={resultSentence(match)}
        action={
          session?.role === "admin" && (
            <Link
              href={`/dashboard/matches/${match.id}/edit`}
              className={buttonVariants({ variant: "outline" })}
            >
              <Pencil aria-hidden />
              Edit match
            </Link>
          )
        }
      />

      <div className="grid gap-6">
        <StatGrid>
          <StatCard
            label="Total runs"
            value={formatNumber(match.teamA.runs + match.teamB.runs)}
            hint={`${match.teamA.name} ${match.teamA.runs}, ${match.teamB.name} ${match.teamB.runs}`}
          />
          <StatCard
            label="Top scorer"
            value={match.topScorer ? formatNumber(match.topScorer.runs) : "0"}
            hint={match.topScorer?.name ?? "No runs recorded"}
          />
          <StatCard
            label="Best bowling"
            value={
              match.bestBowler ? `${match.bestBowler.wickets} wickets` : "0"
            }
            hint={match.bestBowler?.name ?? "No wickets recorded"}
          />
          <StatCard
            label="Players"
            value={formatNumber(playerCount)}
            hint="Across both teams"
          />
        </StatGrid>

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
    <section className="panel overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
        <h2 className="font-semibold">{team.name}</h2>
        {team.won && (
          <span className="rounded-sm bg-accent px-2 py-1 text-[13px] leading-none font-medium text-accent-foreground">
            Won
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
            <TableRow>
              <TableHead>Player</TableHead>
              <TableHead className="text-right">Runs</TableHead>
              <TableHead className="text-right">Wickets</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {team.performances.map((p) => (
              <TableRow key={p.playerId}>
                <TableCell>
                  <div className="flex flex-col gap-1.5">
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
            <TableRow>
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

/** "Kathmandu Kings won on Sat, 12 October 2026." */
const resultSentence = (m: TMatchDetail) => {
  const date = dateFmt.format(m.playedAt);
  if (m.status === "completed" && m.winner) return `${m.winner} won on ${date}.`;
  if (m.status === "draw") return `Drawn on ${date}.`;
  return `Not played yet. Scheduled for ${date}.`;
};

function MatchSkeleton() {
  return (
    <div className="grid gap-6" aria-busy="true">
      <div className="grid gap-2">
        <Skeleton className="h-8 w-2/3 max-w-md" />
        <Skeleton className="h-4 w-60" />
      </div>
      <Skeleton className="h-28 rounded-lg" />
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-80 rounded-lg" />
        <Skeleton className="h-80 rounded-lg" />
      </div>
    </div>
  );
}
