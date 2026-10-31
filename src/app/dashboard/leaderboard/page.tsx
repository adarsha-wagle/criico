import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { buttonVariants } from "@/components/ui/button";
import { getSession } from "@/lib/jwt";
import { getLeaderboard } from "@/lib/queries/leaderboard";
import { leaderboardQuerySchema } from "@/lib/validation/leaderboard";
import { PageHeader } from "@/components/reusables/page-header";
import { RoleFilter } from "@/components/reusables/role-filter";
import { TableSkeleton } from "@/components/reusables/table-skeleton";
import { EmptyState } from "@/components/reusables/empty-state";
import { LeaderboardTable } from "./_components/leaderboard-table";

export const metadata: Metadata = { title: "Leaderboard" };

type SearchParams = Promise<{ role?: string | string[] }>;

/**
 * React Server Component leaderboard.
 *
 * - Data is fetched on the server by calling getLeaderboard() directly: no client JS,
 *   no useEffect, no fetch to our own API.
 * - cacheComponents (Next 16): anything reading the DB or searchParams must be inside
 *   <Suspense>, so the static shell (heading) streams instantly and the table streams in.
 */
export default function LeaderboardPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <>
      <PageHeader
        title="Leaderboard"
        description="Players ranked by Impact Score. Players with equal scores share a rank."
      />
      <Suspense fallback={<TableSkeleton rows={8} />}>
        <LeaderboardContent searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function LeaderboardContent({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { role: rawRole } = await searchParams;
  // Invalid ?role=xyz falls back to "All roles" instead of crashing the page.
  const parsed = leaderboardQuerySchema.safeParse({
    role: typeof rawRole === "string" ? rawRole : undefined,
  });
  const role = parsed.success ? parsed.data.role : undefined;

  const [board, session] = await Promise.all([
    getLeaderboard({ role }),
    getSession(),
  ]);
  const isAdmin = session?.role === "admin";

  return (
    <>
      <RoleFilter active={role} />
      {board.length === 0 ? (
        <EmptyState
          title={role ? `No ${role.toLowerCase()}s yet` : "No players yet"}
          description={
            role
              ? "Choose another role above, or add a player with this role."
              : "Players appear here as soon as an admin adds them."
          }
          action={
            isAdmin && (
              <Link href="/dashboard/players/new" className={buttonVariants()}>
                Add player
              </Link>
            )
          }
        />
      ) : (
        <LeaderboardTable entries={board} />
      )}
    </>
  );
}
