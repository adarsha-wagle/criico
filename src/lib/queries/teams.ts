import "server-only";
import { connection } from "next/server";
import { asc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { matches, players, teams } from "@/db/schema";

/**
 * The outer row's team id, written as "teams"."id". In a single-table select Drizzle prints
 * columns without their table, so a bare ${teams.id} inside a subquery reads as the
 * subquery table's own "id" (players.id / matches.id) and every count comes out 0.
 */
const outerTeamId = sql`${teams}.${sql.identifier(teams.id.name)}`;

/**
 * Only finished matches (completed or draw) count towards played / won / drawn / lost.
 */
export async function listTeams() {
  await connection();
  const rows = await db
    .select({
      id: teams.id,
      name: teams.name,
      playerCount:
        sql<number>`(select count(*) from ${players} where ${players.teamId} = ${outerTeamId})`.mapWith(
          Number,
        ),
      played: sql<number>`(
        select count(*) from ${matches}
        where (${matches.teamAId} = ${outerTeamId} or ${matches.teamBId} = ${outerTeamId})
          and ${matches.status} in ('completed', 'draw')
      )`.mapWith(Number),
      won: sql<number>`(select count(*) from ${matches} where ${matches.winnerTeamId} = ${outerTeamId})`.mapWith(
        Number,
      ),
      drawn: sql<number>`(
        select count(*) from ${matches}
        where (${matches.teamAId} = ${outerTeamId} or ${matches.teamBId} = ${outerTeamId})
          and ${matches.status} = 'draw'
      )`.mapWith(Number),
    })
    .from(teams)
    .orderBy(asc(teams.name));

  return rows.map((t) => ({ ...t, lost: t.played - t.won - t.drawn }));
}
export type TeamSummary = Awaited<ReturnType<typeof listTeams>>[number];

/** One team plus the players assigned to it, for the edit page. */
export async function getTeamById(id: string) {
  await connection();
  const [team] = await db
    .select({ id: teams.id, name: teams.name })
    .from(teams)
    .where(eq(teams.id, id));
  if (!team) return null;

  const squad = await db
    .select({ id: players.id, name: players.name, role: players.role })
    .from(players)
    .where(eq(players.teamId, id))
    .orderBy(asc(players.name));

  return { ...team, squad };
}

/** Every team as { id, name }, for team pickers in forms. */
export async function listTeamOptions() {
  await connection();
  return db
    .select({ id: teams.id, name: teams.name })
    .from(teams)
    .orderBy(asc(teams.name));
}
export type TeamOption = Awaited<ReturnType<typeof listTeamOptions>>[number];
