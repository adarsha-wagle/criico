import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { getLeaderboard } from "@/lib/queries/leaderboard";
import { leaderboardQuerySchema } from "@/lib/validation/leaderboard";
import { TPlayerRole } from "@/lib/validation/player";
import { PLAYER_ROLES } from "@/config/constant";

export const metadata: Metadata = { title: "Leaderboard · Criico" };

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
    <main className="mx-auto max-w-5xl px-4 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Leaderboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Players ranked by Cricket Impact Score.
        </p>
      </header>

      <Suspense fallback={<LeaderboardSkeleton />}>
        <LeaderboardTable searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

/* ------------------------------------------------------------------ */

async function LeaderboardTable({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { role: rawRole } = await searchParams;
  // Invalid ?role=xyz falls back to "All" instead of crashing the page.
  const parsed = leaderboardQuerySchema.safeParse({
    role: typeof rawRole === "string" ? rawRole : undefined,
  });
  const role = parsed.success ? parsed.data.role : undefined;

  const board = await getLeaderboard({ role });

  return (
    <>
      <RoleFilter active={role} />

      {board.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 p-10 text-center">
          <p className="text-gray-600">
            No players {role ? `with role ${role}` : "yet"}.
          </p>
          <Link
            href="/dashboard/players/new"
            className="mt-3 inline-block text-sm font-medium text-emerald-700 hover:underline"
          >
            Add a player →
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Player</th>
                <th className="px-4 py-3 text-right">M</th>
                <th className="px-4 py-3 text-right">Runs</th>
                <th className="px-4 py-3 text-right">Wkts</th>
                <th className="hidden px-4 py-3 md:table-cell">Breakdown</th>
                <th className="px-4 py-3 text-right">Impact</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {board.map(({ rank, player, impact }) => (
                <tr key={player.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-semibold tabular-nums text-gray-700">
                    <RankBadge rank={rank} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">
                      {player.name}
                    </div>
                    <RolePill role={player.role} />
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {player.matchesPlayed}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {player.totalRuns}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {player.totalWickets}
                  </td>
                  <td className="hidden px-4 py-3 text-xs text-gray-500 md:table-cell">
                    <span title="Run points">🏏 {fmt(impact.runPoints)}</span>
                    <span className="mx-2" title="Wicket points">
                      🎯 {fmt(impact.wicketPoints)}
                    </span>
                    {impact.roleBonus !== 0 && (
                      <span className="mr-2">🧤 +{impact.roleBonus}</span>
                    )}
                    {impact.experienceAdjustment !== 0 && (
                      <span
                        className={
                          impact.experienceAdjustment > 0
                            ? "text-emerald-700"
                            : "text-red-600"
                        }
                      >
                        {impact.experienceAdjustment > 0
                          ? "Veteran +"
                          : "Rookie "}
                        {impact.experienceAdjustment}
                      </span>
                    )}
                  </td>
                  <td
                    className={`px-4 py-3 text-right font-bold tabular-nums ${
                      impact.total < 0 ? "text-red-600" : "text-gray-900"
                    }`}
                  >
                    {fmt(impact.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

/* Small presentational pieces (still server-rendered, zero client JS) -------- */

function RoleFilter({ active }: { active?: TPlayerRole }) {
  const options: (TPlayerRole | undefined)[] = [undefined, ...PLAYER_ROLES];
  return (
    <nav className="mb-4 flex flex-wrap gap-2" aria-label="Filter by role">
      {options.map((r) => {
        const isActive = r === active;
        return (
          <Link
            key={r ?? "all"}
            href={r ? `?role=${encodeURIComponent(r)}` : "?"}
            aria-current={isActive ? "page" : undefined}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
              isActive
                ? "border-emerald-600 bg-emerald-600 text-white"
                : "border-gray-300 text-gray-700 hover:border-gray-400"
            }`}
          >
            {r ?? "All"}
          </Link>
        );
      })}
    </nav>
  );
}

function RankBadge({ rank }: { rank: number }) {
  const medal =
    rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : null;
  return medal ? <span aria-label={`Rank ${rank}`}>{medal}</span> : <>{rank}</>;
}

const ROLE_STYLES: Record<TPlayerRole, string> = {
  Batsman: "bg-blue-50 text-blue-700",
  Bowler: "bg-rose-50 text-rose-700",
  "All-rounder": "bg-amber-50 text-amber-700",
  Wicketkeeper: "bg-violet-50 text-violet-700",
};

function RolePill({ role }: { role: TPlayerRole }) {
  return (
    <span
      className={`mt-0.5 inline-block rounded px-1.5 py-0.5 text-[11px] font-medium ${ROLE_STYLES[role]}`}
    >
      {role}
    </span>
  );
}

function LeaderboardSkeleton() {
  return (
    <div
      className="animate-pulse space-y-2"
      aria-busy="true"
      aria-label="Loading leaderboard"
    >
      <div className="mb-4 flex gap-2">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="h-6 w-20 rounded-full bg-gray-200" />
        ))}
      </div>
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="h-12 rounded bg-gray-100" />
      ))}
    </div>
  );
}

const fmt = (n: number) =>
  n.toLocaleString("en-US", { maximumFractionDigits: 2 });
