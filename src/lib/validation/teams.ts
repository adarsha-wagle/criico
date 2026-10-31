import { z } from "zod";
import { playerInputSchema } from "./player";

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

export const MAX_SQUAD_SIZE = 25;

export const squadPlayerSchema = playerInputSchema.pick({
  name: true,
  role: true,
});

export const teamCreateSchema = teamInputSchema
  .extend({
    players: z.array(squadPlayerSchema).max(MAX_SQUAD_SIZE, {
      error: `A squad can have at most ${MAX_SQUAD_SIZE} players`,
    }),
  })
  .superRefine((t, ctx) => {
    const seen = new Set<string>();
    t.players.forEach((p, i) => {
      const key = p.name.toLowerCase();
      if (seen.has(key)) {
        ctx.addIssue({
          code: "custom",
          path: ["players", i, "name"],
          message: `${p.name} is listed twice`,
        });
      }
      seen.add(key);
    });
  });
export type TTeamCreateInput = z.infer<typeof teamCreateSchema>;
