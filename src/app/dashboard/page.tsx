import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatNumber, formatScore } from "@/lib/format";
import { getDashboardStats } from "@/lib/queries/dashboard";
import { PageHeader } from "@/components/reusables/page-header";
import { EmptyState } from "@/components/reusables/empty-state";
import { StatCard } from "@/components/reusables/stat-card";
import { LeaderboardTable } from "./leaderboard/_components/leaderboard-table";
import { RoleBreakdown } from "@/components/reusables/role-breakdown";

export const metadata: Metadata = { title: "Overview" };

export default function DashboardOverviewPage() {
  return (
    <>
      <PageHeader
        title="Overview"
        description="The state of the club register right now."
      />
      <Suspense fallback={<OverviewSkeleton />}>
        <OverviewContent />
      </Suspense>
    </>
  );
}

async function OverviewContent() {
  const stats = await getDashboardStats();

  if (stats.total === 0) {
    return (
      <EmptyState
        title="No players registered"
        description="Add your first player to start building the leaderboard."
        action={
          <Link href="/dashboard/players/new" className={buttonVariants()}>
            Add a player
          </Link>
        }
      />
    );
  }

  return (
    <div className="grid gap-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Players"
          value={formatNumber(stats.total)}
          hint="Registered with the club"
        />
        <StatCard
          label="Average impact"
          value={formatScore(stats.averageScore)}
          hint="Across all players"
          tone={stats.averageScore < 0 ? "negative" : "default"}
        />
        <StatCard
          label="Top impact"
          value={
            stats.topEntry ? formatScore(stats.topEntry.impact.total) : "0"
          }
          hint={stats.topEntry?.player.name}
        />
        <StatCard
          label="Rookies"
          value={formatNumber(stats.rookies)}
          hint="Under 5 matches, 50 point penalty"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <section>
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="font-semibold">Top five by Impact Score</h2>
            <Link
              href="/dashboard/leaderboard"
              className="text-sm font-medium text-primary underline underline-offset-4"
            >
              Full leaderboard
            </Link>
          </div>
          <LeaderboardTable entries={stats.topFive} compact />
        </section>

        <section>
          <h2 className="mb-3 font-semibold">Squad by role</h2>
          <div className="border bg-card p-4">
            <RoleBreakdown counts={stats.roleCounts} total={stats.total} />
          </div>
        </section>
      </div>
    </div>
  );
}

function OverviewSkeleton() {
  return (
    <div className="grid gap-6" aria-busy="true">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <Skeleton className="h-72" />
        <Skeleton className="h-72" />
      </div>
    </div>
  );
}
