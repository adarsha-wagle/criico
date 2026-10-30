import { z } from "zod";

export const nonNegInt = (label: string) =>
  z.coerce
    .number({ message: `${label} must be a number` })
    .int(`${label} must be a whole number`)
    .min(0, `${label} cannot be negative`);

export const id = (label: string) => z.uuid({ error: `Invalid ${label}` });

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
