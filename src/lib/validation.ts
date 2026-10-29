import { PLAYER_ROLES } from "@/config/constant";
import { z } from "zod";

const nonNegInt = (label: string) =>
  z.coerce
    .number({ message: `${label} must be a number` })
    .int(`${label} must be a whole number`)
    .min(0, `${label} cannot be negative`);

export const playerInputSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(80),
  role: z.enum(PLAYER_ROLES),
  basePrice: nonNegInt("Base Price"),
  matchesPlayed: nonNegInt("Matches Played"),
  totalRuns: nonNegInt("Total Runs"),
  totalWickets: nonNegInt("Total Wickets"),
});

export type TPlayerInput = z.infer<typeof playerInputSchema>;
