import { z } from "zod";

/**
 * Team name rules, shared by the team form and anything else that names a team.
 * Trims and collapses inner spaces, so "Kathmandu  Gorkhas " and "Kathmandu Gorkhas" match.
 */
export const teamNameSchema = z
  .string({ error: "Team name is required" })
  .transform((s) => s.trim().replace(/\s+/g, " "))
  .pipe(
    z
      .string()
      .min(2, { error: "Team name must be at least 2 characters" })
      .max(60, { error: "Team name must be at most 60 characters" }),
  );

export const teamInputSchema = z.object({ name: teamNameSchema });
export type TTeamInput = z.infer<typeof teamInputSchema>;
