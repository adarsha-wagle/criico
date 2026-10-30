import { z } from "zod";

// Also checks exceed
export const nonNegInt = (label: string, max?: number) => {
  let schema = z.coerce
    .number({ error: `${label} is required and must be a number` })
    .int({ error: `${label} must be a whole number` })
    .min(0, { error: `${label} cannot be negative` });
  if (max !== undefined)
    schema = schema.max(max, { error: `${label} cannot exceed ${max}` });

  return z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    schema,
  );
};

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
