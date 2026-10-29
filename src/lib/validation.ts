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

export interface ValidationFailure {
  message: string; // first error, for the toast
  fieldErrors: Record<string, string[] | undefined>; // per-field, for inline messages
}

export function formatZodError(error: z.ZodError): ValidationFailure {
  const { formErrors, fieldErrors } = z.flattenError(error);
  const message =
    formErrors[0] ??
    Object.values(fieldErrors).flat().find(Boolean) ??
    "Invalid input";
  return { message, fieldErrors };
}
