import "server-only";
import { getLeaderboard } from "./leaderboard";
import { PLAYER_ROLES, ROOKIE_MATCH_LIMIT } from "@/config/constant";

/** Everything the overview page shows, from a single players query. */
export async function getDashboardStats() {
  const board = await getLeaderboard();
  const total = board.length;

  const scoreSum = board.reduce((sum, e) => sum + e.impact.total, 0);
  const averageScore = total ? Math.round((scoreSum / total) * 100) / 100 : 0;

  return {
    total,
    averageScore,
    topEntry: board[0] ?? null,
    rookies: board.filter((e) => e.player.matchesPlayed < ROOKIE_MATCH_LIMIT)
      .length,
    roleCounts: PLAYER_ROLES.map((role) => ({
      role,
      count: board.filter((e) => e.player.role === role).length,
    })),
    topFive: board.slice(0, 5),
  };
}
