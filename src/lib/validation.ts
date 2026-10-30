import { PLAYER_ROLES } from "@/config/constant";
import { z } from "zod";

const nonNegInt = (label: string) =>
  z.coerce
    .number({ message: `${label} must be a number` })
    .int(`${label} must be a whole number`)
    .min(0, `${label} cannot be negative`);

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

// PLAYER --------------------------

export const playerInputSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(80),
  role: z.enum(PLAYER_ROLES),
  basePrice: nonNegInt("Base Price"),
  matchesPlayed: nonNegInt("Matches Played"),
  totalRuns: nonNegInt("Total Runs"),
  totalWickets: nonNegInt("Total Wickets"),
});

export type TPlayerInput = z.infer<typeof playerInputSchema>;

// AUTH--------------

const email = z
  .string({ error: "Email is required" })
  .trim()
  .toLowerCase() // "Admin@X.com" and "admin@x.com" are the same account
  .pipe(z.email({ error: "Enter a valid email address" }));

export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, { error: "Name must be at least 2 characters" })
    .max(80),
  email,
  // bcrypt silently ignores bytes after 72, so cap it instead of truncating secretly.
  password: z
    .string({ error: "Password is required" })
    .min(8, { error: "Password must be at least 8 characters" })
    .max(72, { error: "Password must be at most 72 characters" }),
});
export type TRegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email,
  password: z
    .string({ error: "Password is required" })
    .min(1, { error: "Password is required" })
    .max(72),
});
export type LoginInput = z.infer<typeof loginSchema>;
