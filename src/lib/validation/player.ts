import { PLAYER_ROLES } from "@/config/constant";
import { z } from "zod";
import { id, nonNegInt } from "./shared";

// PLAYER SCHEMA --------------------------

export const playerInputSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(80),
  role: z.enum(PLAYER_ROLES, { error: "Choose a role" }),
  // "" from the form's "No team" option means unassigned.
  teamId: z.preprocess(
    (v) => (v === "" ? null : v),
    z.uuid({ error: "Choose a valid team" }).nullable().optional(),
  ),
  basePrice: nonNegInt("Base Price"),
  matchesPlayed: nonNegInt("Matches Played"),
  totalRuns: nonNegInt("Total Runs"),
  totalWickets: nonNegInt("Total Wickets"),
});
export type TPlayerInput = z.infer<typeof playerInputSchema>;

export const playerUpdateSchema = playerInputSchema
  .partial()
  .refine((d) => Object.keys(d).length > 0, {
    error: "Provide at least one field to update",
  });

export type TPlayerUpdate = z.infer<typeof playerUpdateSchema>;
export const idParamSchema = id("player id");

// Types

export type TPlayerRole = (typeof PLAYER_ROLES)[number];

export interface IPlayerStats {
  role: TPlayerRole;
  matchesPlayed: number;
  totalRuns: number;
  totalWickets: number;
}
