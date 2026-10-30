"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { players } from "@/db/schema";
import { FieldErrors, PG, pgErrorCode } from "@/lib/api";
import { getSession } from "@/lib/jwt";
import { idParamSchema, playerInputSchema } from "@/lib/validation/player";
import { formatZodError } from "@/lib/validation/shared";

/**
 * Server Actions for the add / edit player form (the brief's required Server Action).
 * They never throw for expected problems: they return a state the form turns into a toast.
 */

export type PlayerFormState =
  | null
  | { ok: true; message: string }
  | {
      ok: false;
      message: string;
      fieldErrors?: FieldErrors;
      /** Submitted values, echoed back so the form keeps what the user typed. */
      values?: Record<string, string>;
    };

/** FormData → plain object of the user's fields (skips Next's internal $ACTION_* keys). */
function readValues(formData: FormData): Record<string, string> {
  const values: Record<string, string> = {};
  for (const [key, value] of formData) {
    if (!key.startsWith("$") && typeof value === "string") values[key] = value;
  }
  return values;
}

/** Actions are public HTTP endpoints, so check auth here too, not just in the UI. */
async function adminCheck(): Promise<string | null> {
  const session = await getSession();
  if (!session) return "Your session has expired. Log in again.";
  if (session.role !== "admin") return "Only admins can add or edit players.";
  return null;
}

function refreshPages() {
  revalidatePath("/dashboard", "layout"); // overview, players, leaderboard
  revalidatePath("/"); // home page top five
}

export async function createPlayerAction(
  _prev: PlayerFormState,
  formData: FormData,
): Promise<PlayerFormState> {
  const values = readValues(formData);

  const denied = await adminCheck();
  if (denied) return { ok: false, message: denied, values };

  // Negative Total Runs fails here with "Total Runs cannot be negative" → toast.
  const parsed = playerInputSchema.safeParse(values);
  if (!parsed.success)
    return { ok: false, ...formatZodError(parsed.error), values };

  try {
    await db.insert(players).values(parsed.data);
  } catch (err) {
    const message =
      pgErrorCode(err) === PG.CHECK_VIOLATION
        ? "Stats cannot be negative"
        : "Could not save the player. Try again.";
    if (message !== "Stats cannot be negative")
      console.error("[createPlayerAction]", err);
    return { ok: false, message, values };
  }

  refreshPages();
  return { ok: true, message: `${parsed.data.name} added` };
}

/** Bound with the player id on the client: updatePlayerAction.bind(null, id). */
export async function updatePlayerAction(
  id: string,
  _prev: PlayerFormState,
  formData: FormData,
): Promise<PlayerFormState> {
  const values = readValues(formData);

  const denied = await adminCheck();
  if (denied) return { ok: false, message: denied, values };

  if (!idParamSchema.safeParse(id).success)
    return { ok: false, message: "Invalid player id", values };

  const parsed = playerInputSchema.safeParse(values);
  if (!parsed.success)
    return { ok: false, ...formatZodError(parsed.error), values };

  try {
    const [player] = await db
      .update(players)
      .set(parsed.data)
      .where(eq(players.id, id))
      .returning({ id: players.id });
    if (!player)
      return { ok: false, message: "This player no longer exists.", values };
  } catch (err) {
    const message =
      pgErrorCode(err) === PG.CHECK_VIOLATION
        ? "Stats cannot be negative"
        : "Could not save the player. Try again.";
    if (message !== "Stats cannot be negative")
      console.error("[updatePlayerAction]", err);
    return { ok: false, message, values };
  }

  refreshPages();
  return { ok: true, message: `${parsed.data.name} updated` };
}
