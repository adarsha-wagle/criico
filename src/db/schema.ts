import { MATCH_STATUS, PLAYER_ROLES, USER_ROLES } from "@/config/constant";
import { relations, sql } from "drizzle-orm";
import {
  pgEnum,
  pgTable,
  timestamp,
  text,
  integer,
  uuid,
  unique,
  check,
  index,
} from "drizzle-orm/pg-core";

export const playerRoleEnum = pgEnum("player_role", PLAYER_ROLES);
export const userRoleEnum = pgEnum("user_role", USER_ROLES);
export const matchStatusEnum = pgEnum("match_status", MATCH_STATUS);

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
};

export const players = pgTable(
  "players",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    teamId: uuid("team_id").references(() => teams.id, {
      onDelete: "set null",
    }),
    role: playerRoleEnum("role").notNull(),
    basePrice: integer("base_price").notNull().default(0),
    matchesPlayed: integer("matches_played").notNull().default(0),
    totalRuns: integer("total_runs").notNull().default(0),
    totalWickets: integer("total_wickets").notNull().default(0),
    ...timestamps,
  },
  (t) => [
    // Postgres refuses negative stats.
    check("players_base_price_nonneg", sql`${t.basePrice} >= 0`),
    check("players_matches_nonneg", sql`${t.matchesPlayed} >= 0`),
    check("players_runs_nonneg", sql`${t.totalRuns} >= 0`),
    check("players_wickets_nonneg", sql`${t.totalWickets} >= 0`),
    index("players_team_idx").on(t.teamId),
  ],
);

export const playersRelations = relations(players, ({ one, many }) => ({
  team: one(teams, { fields: [players.teamId], references: [teams.id] }),
  performances: many(matchPerformances),
}));

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(), // stored lowercase
  passwordHash: text("password_hash").notNull(), // bcrypt
  role: userRoleEnum("role").notNull().default("viewer"),
  ...timestamps,
});

export const teams = pgTable("teams", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  ...timestamps,
});

export const teamsRelations = relations(teams, ({ many }) => ({
  players: many(players),
  matchesAsTeamA: many(matches, { relationName: "teamA" }),
  matchesAsTeamB: many(matches, { relationName: "teamB" }),
  matchesWon: many(matches, { relationName: "winner" }),
}));

export const matches = pgTable(
  "matches",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    teamAId: uuid("team_a_id")
      .notNull()
      .references(() => teams.id),

    teamBId: uuid("team_b_id")
      .notNull()
      .references(() => teams.id),

    winnerTeamId: uuid("winner_team_id").references(() => teams.id),

    playedAt: timestamp("played_at", { withTimezone: true })
      .defaultNow()
      .notNull(),

    recordedBy: uuid("recorded_by").references(() => users.id),

    status: matchStatusEnum("status").default("scheduled").notNull(),
  },
  (t) => [
    // Teams must be different
    check("matches_distinct_teams", sql`${t.teamAId} <> ${t.teamBId}`),

    // Winner must be one of the participating teams
    check(
      "matches_valid_winner",
      sql`
        ${t.winnerTeamId} IS NULL
        OR ${t.winnerTeamId} IN (${t.teamAId}, ${t.teamBId})
      `,
    ),

    // Enforce winner/draw rules
    check(
      "matches_valid_result",
      sql`
        (
          ${t.status} IN ('scheduled', 'in_progress')
          AND ${t.winnerTeamId} IS NULL
        )
        OR
        (
          ${t.status} = 'completed'
          AND ${t.winnerTeamId} IS NOT NULL
        )
        OR
        (
          ${t.status} = 'draw'
          AND ${t.winnerTeamId} IS NULL
        )
      `,
    ),
  ],
);

export const matchPerformances = pgTable(
  "match_performances",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    matchId: uuid("match_id")
      .notNull()
      .references(() => matches.id, { onDelete: "cascade" }),
    playerId: uuid("player_id")
      .notNull()
      .references(() => players.id, { onDelete: "cascade" }),
    teamId: uuid("team_id")
      .notNull()
      .references(() => teams.id),
    runs: integer("runs").notNull().default(0),
    wickets: integer("wickets").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    unique("perf_match_player_uq").on(t.matchId, t.playerId), // no double-counting
    check("perf_runs_nonneg", sql`${t.runs} >= 0`),
    check("perf_wickets_nonneg", sql`${t.wickets} >= 0 AND ${t.wickets} <= 10`),
    index("perf_player_idx").on(t.playerId),
  ],
);

export const matchesRelations = relations(matches, ({ one, many }) => ({
  teamA: one(teams, {
    fields: [matches.teamAId],
    references: [teams.id],
    relationName: "teamA",
  }),
  teamB: one(teams, {
    fields: [matches.teamBId],
    references: [teams.id],
    relationName: "teamB",
  }),
  winner: one(teams, {
    fields: [matches.winnerTeamId],
    references: [teams.id],
    relationName: "winner",
  }),
  recorder: one(users, {
    fields: [matches.recordedBy],
    references: [users.id],
  }),
  performances: many(matchPerformances),
}));

export const matchPerformancesRelations = relations(
  matchPerformances,
  ({ one }) => ({
    match: one(matches, {
      fields: [matchPerformances.matchId],
      references: [matches.id],
    }),
    player: one(players, {
      fields: [matchPerformances.playerId],
      references: [players.id],
    }),
    team: one(teams, {
      fields: [matchPerformances.teamId],
      references: [teams.id],
    }),
  }),
);

export type TPlayer = typeof players.$inferSelect;
export type TNewPlayer = typeof players.$inferInsert;
export type TMatch = typeof matches.$inferSelect;
export type TMatchStatus = (typeof MATCH_STATUS)[number];
