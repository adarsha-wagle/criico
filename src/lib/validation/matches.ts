import { z } from "zod"; // Zod v4

/* Constants --------------------------------------------------------- */

export const TEAM_SIDES = ["A", "B"] as const;
export const MATCH_RESULTS = ["A", "B", "draw"] as const;

/** One limited-overs innings: a side can lose at most 10 wickets. */
export const MAX_WICKETS_PER_INNINGS = 10;
/** Playing XI plus substitutes; generous for local cricket. */
export const MAX_PLAYERS_PER_SIDE = 15;

export type TTeamSide = (typeof TEAM_SIDES)[number];
export type TMatchResult = (typeof MATCH_RESULTS)[number];

/* Field helpers ----------------------------------------------------- */

/**
 * Non-negative whole number. Accepts numbers or numeric strings ("42") from inputs.
 * "" becomes undefined first, because z.coerce.number() would turn "" into 0.
 */
const count = (label: string, max?: number) => {
  let schema = z.coerce
    .number({ error: `${label} is required and must be a number` })
    .int({ error: `${label} must be a whole number` })
    .min(0, { error: `${label} cannot be negative` });
  if (max !== undefined)
    schema = schema.max(max, { error: `${label} cannot be more than ${max}` });
  return z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    schema,
  );
};

/** Trims and collapses inner spaces, so "Kathmandu  Kings " and "Kathmandu Kings" are one team. */
const teamName = (label: string) =>
  z
    .string({ error: `${label} is required` })
    .transform((s) => s.trim().replace(/\s+/g, " "))
    .pipe(
      z
        .string()
        .min(2, { error: `${label} name must be at least 2 characters` })
        .max(60, { error: `${label} name must be at most 60 characters` }),
    );

const ONE_DAY_MS = 86_400_000;

const playedAt = z.preprocess(
  (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
  z.coerce
    .date({ error: "Enter a valid match date" })
    .refine((d) => d.getFullYear() >= 1900, {
      error: "Match date is too far in the past",
    })
    // One day of slack: "today" in Nepal (UTC+5:45) can still be "yesterday" in UTC.
    .refine((d) => d.getTime() <= Date.now() + ONE_DAY_MS, {
      error: "Match date cannot be in the future",
    })
    .optional(),
);

/* Schemas ----------------------------------------------------------- */

export const performanceSchema = z.object({
  playerId: z.uuid({ error: "Choose a valid player" }),
  team: z.enum(TEAM_SIDES, { error: "Team must be A or B" }),
  runs: count("Runs"),
  wickets: count("Wickets", MAX_WICKETS_PER_INNINGS),
});
export type TPerformanceInput = z.infer<typeof performanceSchema>;

export const matchInputSchema = z
  .object({
    teamA: teamName("Team A"),
    teamB: teamName("Team B"),
    result: z.enum(MATCH_RESULTS, {
      error: "Result must be Team A, Team B or draw",
    }),
    playedAt,
    performances: z.array(performanceSchema, {
      error: "Performances must be a list",
    }),
  })
  .superRefine((m, ctx) => {
    // Same rule as the DB check "matches_distinct_teams", but case-insensitive.
    if (m.teamA.toLowerCase() === m.teamB.toLowerCase()) {
      ctx.addIssue({
        code: "custom",
        path: ["teamB"],
        message: "Team A and Team B must be different",
      });
    }

    // A player can only appear once in a match, on one side.
    const seen = new Set<string>();
    m.performances.forEach((p, i) => {
      if (seen.has(p.playerId)) {
        ctx.addIssue({
          code: "custom",
          path: ["performances", i, "playerId"],
          message: "A player can only appear once per match",
        });
      }
      seen.add(p.playerId);
    });

    for (const side of TEAM_SIDES) {
      const label = side === "A" ? "Team A" : "Team B";
      const sidePerfs = m.performances.filter((p) => p.team === side);

      if (sidePerfs.length === 0) {
        ctx.addIssue({
          code: "custom",
          path: ["performances"],
          message: `Add at least one player for ${label}`,
        });
      }
      if (sidePerfs.length > MAX_PLAYERS_PER_SIDE) {
        ctx.addIssue({
          code: "custom",
          path: ["performances"],
          message: `${label} cannot have more than ${MAX_PLAYERS_PER_SIDE} players`,
        });
      }

      // A side's bowlers bowl at the other side's single innings: at most 10 wickets between them.
      const wickets = sidePerfs.reduce((sum, p) => sum + p.wickets, 0);
      if (wickets > MAX_WICKETS_PER_INNINGS) {
        ctx.addIssue({
          code: "custom",
          path: ["performances"],
          message: `${label} bowlers took ${wickets} wickets; an innings has at most ${MAX_WICKETS_PER_INNINGS}`,
        });
      }
    }
  });
export type TMatchInput = z.infer<typeof matchInputSchema>;

/* Mapping to the DB -------------------------------------------------- */

/**
 * Turns the form's result into the columns the `matches` table checks:
 *   "A" | "B" → status "completed" + that side as winner
 *   "draw"    → status "draw" + no winner
 * Kept here (pure, no DB) so it can be unit-tested and reused.
 */
export function resolveResult(result: TMatchResult): {
  status: "completed" | "draw";
  winnerSide: TTeamSide | null;
} {
  return result === "draw"
    ? { status: "draw", winnerSide: null }
    : { status: "completed", winnerSide: result };
}
