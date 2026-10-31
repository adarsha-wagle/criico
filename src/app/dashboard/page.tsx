import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatNumber, formatScore } from "@/lib/format";
import { getSession } from "@/lib/jwt";
import { getDashboardStats } from "@/lib/queries/dashboard";
import { PageHeader } from "@/components/reusables/page-header";
import { EmptyState } from "@/components/reusables/empty-state";
import { StatCard, StatGrid } from "@/components/reusables/stat-card";
import { LeaderboardTable } from "./leaderboard/_components/leaderboard-table";
import { RoleBreakdown } from "@/components/reusables/role-breakdown";

export const metadata: Metadata = { title: "Overview" };

export default function DashboardOverviewPage() {
  return (
    <>
      <PageHeader
        title="Overview"
        description="Where the club register stands today."
      />
      <Suspense fallback={<OverviewSkeleton />}>
        <OverviewContent />
      </Suspense>
    </>
  );
}

async function OverviewContent() {
  const [stats, session] = await Promise.all([
    getDashboardStats(),
    getSession(),
  ]);

  if (stats.total === 0) {
    const isAdmin = session?.role === "admin";
    return (
      <EmptyState
        title="No players registered"
        description={
          isAdmin
            ? "Add your first player to start the leaderboard."
            : "The leaderboard starts once an admin adds players."
        }
        action={
          isAdmin && (
            <Link href="/dashboard/players/new" className={buttonVariants()}>
              Add player
            </Link>
          )
        }
      />
    );
  }

  return (
    <div className="grid gap-6">
      <StatGrid>
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
          hint="Under 5 matches, 50 points deducted"
        />
      </StatGrid>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <section>
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="text-base font-semibold">Top five by Impact Score</h2>
            <Link
              href="/dashboard/leaderboard"
              className="text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              Full leaderboard
            </Link>
          </div>
          <LeaderboardTable entries={stats.topFive} compact />
        </section>

        <section>
          <h2 className="mb-3 text-base font-semibold">Squad by role</h2>
          <div className="panel p-5">
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
      <Skeleton className="h-28 rounded-lg" />
      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <Skeleton className="h-72 rounded-lg" />
        <Skeleton className="h-72 rounded-lg" />
      </div>
    </div>
  );
}
