import "server-only";

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { players } from "@/db/schema";
import { TPlayerRole } from "../validation/player";
import { buildLeaderboard } from "../utils";

export interface LeaderboardOptions {
  role?: TPlayerRole;
  limit?: number;
}

/**
 * Called DIRECTLY by the leaderboard Server Component (no fetch to our own API),
 * and by GET /api/leaderboard, so both always return identical results.
 *
 * Why sort in TypeScript, not SQL ORDER BY? The Impact Score formula lives in one
 * tested TS function. Duplicating it in SQL would mean two copies that could drift.
 * For a local league (hundreds of players) scoring in memory is trivial; at much
 * larger scale I'd store the score in a column updated on every write.
 */
export async function getLeaderboard({ role, limit }: LeaderboardOptions = {}) {
  const rows = await db
    .select({
      id: players.id,
      name: players.name,
      role: players.role,
      basePrice: players.basePrice,
      matchesPlayed: players.matchesPlayed,
      totalRuns: players.totalRuns,
      totalWickets: players.totalWickets,
    })
    .from(players)
    .where(role ? eq(players.role, role) : undefined);

  const board = buildLeaderboard(rows);
  return limit ? board.slice(0, limit) : board;
}

export type Leaderboard = Awaited<ReturnType<typeof getLeaderboard>>;
