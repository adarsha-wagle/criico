import "server-only";
import { asc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { matches, players, teams } from "@/db/schema";

/**
 * Every team with its squad size and record.
 * Only finished matches (completed or draw) count towards played / won / drawn / lost.
 */
export async function listTeams() {
  const rows = await db
    .select({
      id: teams.id,
      name: teams.name,
      playerCount:
        sql<number>`(select count(*) from ${players} where ${players.teamId} = ${teams.id})`.mapWith(
          Number,
        ),
      played: sql<number>`(
        select count(*) from ${matches}
        where (${matches.teamAId} = ${teams.id} or ${matches.teamBId} = ${teams.id})
          and ${matches.status} in ('completed', 'draw')
      )`.mapWith(Number),
      won: sql<number>`(select count(*) from ${matches} where ${matches.winnerTeamId} = ${teams.id})`.mapWith(
        Number,
      ),
      drawn: sql<number>`(
        select count(*) from ${matches}
        where (${matches.teamAId} = ${teams.id} or ${matches.teamBId} = ${teams.id})
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
