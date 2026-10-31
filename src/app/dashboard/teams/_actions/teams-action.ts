"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { players, teams } from "@/db/schema";
import { FieldErrors, PG, pgErrorCode } from "@/lib/api";
import { getSession } from "@/lib/jwt";
import { formatZodError } from "@/lib/validation/shared";
import { teamCreateSchema, teamInputSchema } from "@/lib/validation/teams";
import { idParamSchema } from "@/lib/validation/player";

/** Server Actions for the add / edit team form. Expected problems come back as state, never thrown. */

export type TeamFormState =
  | null
  | { ok: true; message: string; teamId: string }
  | {
      ok: false;
      message: string;
      /** Squad rows use keys like "players.2.name". */
      fieldErrors?: FieldErrors;
      values?: { name?: string };
    };

async function adminCheck(): Promise<string | null> {
  const session = await getSession();
  if (!session) return "Your session has expired. Log in again.";
  if (session.role !== "admin") return "Only admins can add or edit teams.";
  return null;
}

/** Unique name clash → friendly message on the name field. */
function saveError(err: unknown, name: string): TeamFormState {
  if (pgErrorCode(err) === PG.UNIQUE_VIOLATION) {
    const message = `A team called "${name}" already exists`;
    return {
      ok: false,
      message,
      fieldErrors: { name: [message] },
      values: { name },
    };
  }
  console.error("[team action]", err);
  return {
    ok: false,
    message: "Could not save the team. Try again.",
    values: { name },
  };
}

function refreshPages() {
  revalidatePath("/dashboard", "layout"); // team names appear on matches and players too
}

function readSquad(formData: FormData) {
  const names = formData.getAll("playerName").map(String);
  const roles = formData.getAll("playerRole").map(String);
  return names
    .map((name, i) => ({ name, role: roles[i] ?? "" }))
    .filter((p) => p.name.trim() || p.role);
}

/** Creates the team first, then its players with the new team id, in one transaction. */
export async function createTeamAction(
  _prev: TeamFormState,
  formData: FormData,
): Promise<TeamFormState> {
  const name = String(formData.get("name") ?? "");

  const denied = await adminCheck();
  if (denied) return { ok: false, message: denied, values: { name } };

  const parsed = teamCreateSchema.safeParse({
    name,
    players: readSquad(formData),
  });
  if (!parsed.success) {
    const { message, fieldErrors } = formatZodError(parsed.error);
    // flattenError keeps only the top-level key; spell out the row so the form can mark it.
    for (const issue of parsed.error.issues) {
      const [root, row, field] = issue.path;
      if (root === "players" && typeof row === "number" && field) {
        const key = `players.${row}.${String(field)}`;
        fieldErrors[key] = [...(fieldErrors[key] ?? []), issue.message];
      }
    }
    return { ok: false, message, fieldErrors, values: { name } };
  }

  const { players: squad, ...team } = parsed.data;
  try {
    const created = await db.transaction(async (tx) => {
      const [row] = await tx
        .insert(teams)
        .values(team)
        .returning({ id: teams.id });
      if (squad.length)
        await tx
          .insert(players)
          .values(squad.map((p) => ({ ...p, teamId: row.id })));
      return row;
    });
    refreshPages();
    const count = squad.length
      ? ` with ${squad.length} ${squad.length === 1 ? "player" : "players"}`
      : "";
    return {
      ok: true,
      message: `${team.name} added${count}`,
      teamId: created.id,
    };
  } catch (err) {
    return saveError(err, team.name);
  }
}

/** Bound with the team id on the client: updateTeamAction.bind(null, id). */
export async function updateTeamAction(
  id: string,
  _prev: TeamFormState,
  formData: FormData,
): Promise<TeamFormState> {
  const name = String(formData.get("name") ?? "");

  const denied = await adminCheck();
  if (denied) return { ok: false, message: denied, values: { name } };
  if (!idParamSchema.safeParse(id).success)
    return { ok: false, message: "Invalid team id", values: { name } };

  const parsed = teamInputSchema.safeParse({ name });
  if (!parsed.success)
    return { ok: false, ...formatZodError(parsed.error), values: { name } };

  try {
    const [team] = await db
      .update(teams)
      .set(parsed.data)
      .where(eq(teams.id, id))
      .returning({ id: teams.id });
    if (!team)
      return {
        ok: false,
        message: "This team no longer exists.",
        values: { name },
      };
    refreshPages();
    return {
      ok: true,
      message: `Renamed to ${parsed.data.name}`,
      teamId: team.id,
    };
  } catch (err) {
    return saveError(err, parsed.data.name);
  }
}
