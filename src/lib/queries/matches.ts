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

/** Friendly message for a failed DB CHECK on match tables (Zod normally catches these first). */
export function matchCheckMessage(constraint: string | undefined): string {
  switch (constraint) {
    case "matches_distinct_teams":
      return "Team A and Team B must be different";
    case "matches_valid_winner":
      return "The winner must be one of the two teams";
    case "matches_valid_result":
      return "A completed match needs a winner, and a draw cannot have one";
    default:
      return "Runs, wickets and player totals cannot be negative";
  }
}

/** Thrown when the match being edited doesn't exist (shown as a 404). */
export class MatchNotFoundError extends Error {}

type PerfTotals = { playerId: string; runs: number; wickets: number };

/** All selected players must still exist, or the FK insert would fail with a vague error. */
async function assertPlayersExist(tx: Tx, input: TMatchInput) {
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
}

/** Team ids + the columns the `matches` table checks, from the validated input. */
async function resolveMatchColumns(tx: Tx, input: TMatchInput) {
  const teamAId = await upsertTeam(tx, input.teamA);
  const teamBId = await upsertTeam(tx, input.teamB);
  const sideToTeam = { A: teamAId, B: teamBId } as const;
  const { status, winnerSide } = resolveResult(input.result);
  return {
    sideToTeam,
    // Satisfies the DB check "matches_valid_result": completed has a winner, draw has none.
    columns: {
      teamAId,
      teamBId,
      status,
      winnerTeamId: winnerSide ? sideToTeam[winnerSide] : null,
    },
  };
}

async function insertPerformances(
  tx: Tx,
  matchId: string,
  input: TMatchInput,
  sideToTeam: { A: string; B: string },
) {
  await tx.insert(matchPerformances).values(
    input.performances.map((p) => ({
      matchId,
      playerId: p.playerId,
      teamId: sideToTeam[p.team],
      runs: p.runs,
      wickets: p.wickets,
    })),
  );
}

/**
 * Adds (direction 1) or removes (direction -1) performances from players' career totals.
 * Done in SQL (total = total + x), not read-modify-write in JS, so two saves at the same
 * moment can't overwrite each other. The players CHECK constraints stop totals going negative.
 */
async function adjustTotals(tx: Tx, perfs: PerfTotals[], direction: 1 | -1) {
  for (const p of perfs) {
    await tx
      .update(players)
      .set({
        totalRuns: sql`${players.totalRuns} + ${direction * p.runs}`,
        totalWickets: sql`${players.totalWickets} + ${direction * p.wickets}`,
        matchesPlayed: sql`${players.matchesPlayed} + ${direction}`,
      })
      .where(eq(players.id, p.playerId));
  }
}

/**
 * Records a match and updates every player's career totals, all in ONE transaction:
 * either the match, its performances and all stat updates are saved, or none are.
 * (This is why the app uses the neon-serverless Pool driver: neon-http has no transactions.)
 */
export async function recordMatch(input: TMatchInput, recordedBy: string) {
  return db.transaction(async (tx) => {
    await assertPlayersExist(tx, input);
    const { sideToTeam, columns } = await resolveMatchColumns(tx, input);

    const [match] = await tx
      .insert(matches)
      .values({
        ...columns,
        playedAt: input.playedAt ?? new Date(),
        recordedBy,
      })
      .returning({ id: matches.id });

    await insertPerformances(tx, match.id, input, sideToTeam);
    await adjustTotals(tx, input.performances, 1);

    return { id: match.id };
  });
}

/**
 * Replaces a recorded match. In ONE transaction:
 *   1. undo the old performances from player totals (subtract runs, wickets, 1 match)
 *   2. delete the old performances
 *   3. update the match row and insert the new performances
 *   4. add the new performances to player totals
 * Without step 1, every edit would count a player's runs twice.
 */
export async function updateMatch(id: string, input: TMatchInput) {
  return db.transaction(async (tx) => {
    const [existing] = await tx
      .select({ id: matches.id, playedAt: matches.playedAt })
      .from(matches)
      .where(eq(matches.id, id));
    if (!existing) throw new MatchNotFoundError("Match not found");

    await assertPlayersExist(tx, input);

    const old = await tx
      .select({
        playerId: matchPerformances.playerId,
        runs: matchPerformances.runs,
        wickets: matchPerformances.wickets,
      })
      .from(matchPerformances)
      .where(eq(matchPerformances.matchId, id));
    await adjustTotals(tx, old, -1);
    await tx.delete(matchPerformances).where(eq(matchPerformances.matchId, id));

    const { sideToTeam, columns } = await resolveMatchColumns(tx, input);
    await tx
      .update(matches)
      .set({ ...columns, playedAt: input.playedAt ?? existing.playedAt })
      .where(eq(matches.id, id));

    await insertPerformances(tx, id, input, sideToTeam);
    await adjustTotals(tx, input.performances, 1);

    return { id };
  });
}

/** A recorded match in the same shape the match form submits, to prefill the edit page. */
export async function getMatchFormValues(id: string) {
  const match = await getMatchById(id);
  if (!match) return null;

  const toRows = (side: "A" | "B", perfs: typeof match.teamA.performances) =>
    perfs.map((p) => ({
      playerId: p.playerId,
      team: side,
      runs: p.runs,
      wickets: p.wickets,
    }));

  return {
    teamA: match.teamA.name,
    teamB: match.teamB.name,
    result: (match.status === "draw"
      ? "draw"
      : match.teamA.won
        ? "A"
        : match.teamB.won
          ? "B"
          : null) as "A" | "B" | "draw" | null,
    playedAt: match.playedAt.toISOString().slice(0, 10),
    performances: [
      ...toRows("A", match.teamA.performances),
      ...toRows("B", match.teamB.performances),
    ],
  };
}
export type MatchFormValues = NonNullable<
  Awaited<ReturnType<typeof getMatchFormValues>>
>;

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

/** One match with both teams and every player's performance, for the scorecard page. */
export async function getMatchById(id: string) {
  const teamA = alias(teams, "team_a");
  const teamB = alias(teams, "team_b");

  const [match] = await db
    .select({
      id: matches.id,
      playedAt: matches.playedAt,
      status: matches.status,
      teamAId: matches.teamAId,
      teamBId: matches.teamBId,
      winnerTeamId: matches.winnerTeamId,
      teamA: teamA.name,
      teamB: teamB.name,
    })
    .from(matches)
    .innerJoin(teamA, eq(matches.teamAId, teamA.id))
    .innerJoin(teamB, eq(matches.teamBId, teamB.id))
    .where(eq(matches.id, id));

  if (!match) return null;

  const rows = await db
    .select({
      playerId: players.id,
      name: players.name,
      role: players.role,
      teamId: matchPerformances.teamId,
      runs: matchPerformances.runs,
      wickets: matchPerformances.wickets,
    })
    .from(matchPerformances)
    .innerJoin(players, eq(players.id, matchPerformances.playerId))
    .where(eq(matchPerformances.matchId, id))
    .orderBy(desc(matchPerformances.runs), asc(players.name));

  const side = (teamId: string, name: string, won: boolean) => {
    const performances = rows.filter((r) => r.teamId === teamId);
    return {
      name,
      won,
      performances,
      runs: performances.reduce((sum, p) => sum + p.runs, 0),
      wickets: performances.reduce((sum, p) => sum + p.wickets, 0),
    };
  };

  return {
    id: match.id,
    playedAt: match.playedAt,
    status: match.status,
    winner:
      match.winnerTeamId === match.teamAId
        ? match.teamA
        : match.winnerTeamId === match.teamBId
          ? match.teamB
          : null,
    teamA: side(
      match.teamAId,
      match.teamA,
      match.winnerTeamId === match.teamAId,
    ),
    teamB: side(
      match.teamBId,
      match.teamB,
      match.winnerTeamId === match.teamBId,
    ),
    topScorer: [...rows].sort((a, b) => b.runs - a.runs)[0] ?? null,
    bestBowler:
      [...rows].sort((a, b) => b.wickets - a.wickets || a.runs - b.runs)[0] ??
      null,
  };
}
export type TMatchDetail = NonNullable<
  Awaited<ReturnType<typeof getMatchById>>
>;
