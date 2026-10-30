import "server-only";
import { asc, desc, eq, inArray, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "@/db";
import { matchPerformances, matches, players, teams } from "@/db/schema";
import { resolveResult, TMatchInput } from "../validation/matches";

/** Expected, user-fixable problems (shown as a 400), as opposed to bugs (500). */
export class MatchInputError extends Error {}

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

/** Find a team by name or create it. One query thanks to ON CONFLICT. */
async function upsertTeam(tx: Tx, name: string) {
  const [team] = await tx
    .insert(teams)
    .values({ name })
    // DO UPDATE (not DO NOTHING) so RETURNING gives back the existing row too.
    .onConflictDoUpdate({ target: teams.name, set: { name } })
    .returning({ id: teams.id });
  return team.id;
}

/**
 * Records a match and updates every player's career totals, all in ONE transaction:
 * either the match, its performances and all stat updates are saved, or none are.
 * (This is why the app uses the neon-serverless Pool driver: neon-http has no transactions.)
 */
export async function recordMatch(input: TMatchInput, recordedBy: string) {
  return db.transaction(async (tx) => {
    const playerIds = input.performances.map((p) => p.playerId);
    const found = await tx
      .select({ id: players.id })
      .from(players)
      .where(inArray(players.id, playerIds));
    if (found.length !== playerIds.length) {
      throw new MatchInputError(
        "One or more selected players no longer exist. Reload and try again.",
      );
    }

    const teamAId = await upsertTeam(tx, input.teamA);
    const teamBId = await upsertTeam(tx, input.teamB);
    const sideToTeam = { A: teamAId, B: teamBId } as const;
    const { status, winnerSide } = resolveResult(input.result);

    const [match] = await tx
      .insert(matches)
      .values({
        teamAId,
        teamBId,
        // Satisfies the DB check "matches_valid_result": completed has a winner, draw has none.
        winnerTeamId: winnerSide ? sideToTeam[winnerSide] : null,
        status,
        playedAt: input.playedAt ?? new Date(),
        recordedBy,
      })
      .returning({ id: matches.id });

    await tx.insert(matchPerformances).values(
      input.performances.map((p) => ({
        matchId: match.id,
        playerId: p.playerId,
        teamId: sideToTeam[p.team],
        runs: p.runs,
        wickets: p.wickets,
      })),
    );

    // Increment in SQL (total = total + x), not read-modify-write in JS,
    // so two matches saved at the same moment can't overwrite each other's totals.
    for (const p of input.performances) {
      await tx
        .update(players)
        .set({
          totalRuns: sql`${players.totalRuns} + ${p.runs}`,
          totalWickets: sql`${players.totalWickets} + ${p.wickets}`,
          matchesPlayed: sql`${players.matchesPlayed} + 1`,
        })
        .where(eq(players.id, p.playerId));
    }

    return { id: match.id };
  });
}

/** Recent matches with team names, winner and how many players took part. */
export async function listMatches(limit = 50) {
  const teamA = alias(teams, "team_a");
  const teamB = alias(teams, "team_b");
  const winner = alias(teams, "winner");

  return db
    .select({
      id: matches.id,
      playedAt: matches.playedAt,
      status: matches.status,
      teamA: teamA.name,
      teamB: teamB.name,
      winner: winner.name,
      playerCount:
        sql<number>`(select count(*) from ${matchPerformances} where ${matchPerformances.matchId} = ${matches.id})`.mapWith(
          Number,
        ),
      totalRuns:
        sql<number>`(select coalesce(sum(${matchPerformances.runs}), 0) from ${matchPerformances} where ${matchPerformances.matchId} = ${matches.id})`.mapWith(
          Number,
        ),
    })
    .from(matches)
    .innerJoin(teamA, eq(matches.teamAId, teamA.id))
    .innerJoin(teamB, eq(matches.teamBId, teamB.id))
    .leftJoin(winner, eq(matches.winnerTeamId, winner.id))
    .orderBy(desc(matches.playedAt), desc(matches.id))
    .limit(limit);
}
export type MatchSummary = Awaited<ReturnType<typeof listMatches>>[number];

/** Existing team names, offered as suggestions in the match form. */
export async function listTeamNames() {
  const rows = await db
    .select({ name: teams.name })
    .from(teams)
    .orderBy(asc(teams.name));
  return rows.map((r) => r.name);
}
