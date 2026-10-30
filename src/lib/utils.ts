import { calculateImpactBreakdown } from "./impact-score";
import { LeaderboardEntry, ILeaderboardInput } from "./validation/leaderboard";

/**
 * Scores every player, sorts by Impact Score (highest first) and assigns ranks.
 *
 * - Ties share a rank and the next rank is skipped ("1, 2, 2, 4"), like sports tables.
 * - Equal scores are ordered by name so the list is stable between requests.
 */
export function buildLeaderboard<T extends ILeaderboardInput>(
  rows: readonly T[],
): LeaderboardEntry<T>[] {
  const scored = rows.map((player) => ({
    player,
    impact: calculateImpactBreakdown(player),
  }));

  scored.sort(
    (a, b) =>
      b.impact.total - a.impact.total ||
      a.player.name.localeCompare(b.player.name),
  );

  let rank = 0;
  return scored.map((entry, i) => {
    if (i === 0 || entry.impact.total !== scored[i - 1].impact.total)
      rank = i + 1;
    return { rank, ...entry };
  });
}
