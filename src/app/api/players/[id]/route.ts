import { type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { players } from "@/db/schema";
import {
  errorResponse,
  PG,
  pgErrorCode,
  readJson,
  requireSession,
  successResponse,
} from "@/lib/api";
import { calculateImpactBreakdown } from "@/lib/impact-score";
import {
  formatZodError,
  idParamSchema,
  playerUpdateSchema,
} from "@/lib/validation/player";

// `params` is a Promise and must be awaited.
type Ctx = { params: Promise<{ id: string }> };

/** A malformed id would make Postgres throw "invalid input syntax for type uuid" (a 500). Catch it as a 400. */
async function parseId(ctx: Ctx) {
  const { id } = await ctx.params;
  const parsed = idParamSchema.safeParse(id);
  return parsed.success ? parsed.data : null;
}

/* GET /api/players/[id] -------------------------------------------- */

export async function GET(_req: NextRequest, ctx: Ctx) {
  // Validate
  const auth = await requireSession();
  if (!auth.ok) return auth.response;

  const id = await parseId(ctx);
  if (!id) return errorResponse(400, "Invalid player id");

  // Fetch from db
  const player = await db.query.players.findFirst({
    where: eq(players.id, id),
  });
  // Return
  if (!player) return errorResponse(404, "Player not found");

  return successResponse(
    { player, impact: calculateImpactBreakdown(player) },
    "Player fetched successfully",
  );
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const auth = await requireSession({ admin: true });
  if (!auth.ok) return auth.response;

  const id = await parseId(ctx);
  if (!id) return errorResponse(400, "Invalid player id");

  const body = await readJson(req);
  if (!body.ok) return body.response;

  // Validates only the fields sent (at least one).
  const parsed = playerUpdateSchema.safeParse(body.value);
  if (!parsed.success) {
    const { message, fieldErrors } = formatZodError(parsed.error);
    return errorResponse(400, message, fieldErrors);
  }

  try {
    // One query: UPDATE ... WHERE id = $1 RETURNING *. No row back means the player doesn't exist.
    const [player] = await db
      .update(players)
      .set(parsed.data)
      .where(eq(players.id, id))
      .returning();
    if (!player) return errorResponse(404, "Player not found");

    revalidatePath("/dashboard/players");
    revalidatePath(`/dashboard/players/${id}/edit`);
    revalidatePath("/dashboard/leaderboard");

    return successResponse(
      { player, impact: calculateImpactBreakdown(player) },
      "Player updated successfully",
    );
  } catch (err) {
    if (pgErrorCode(err) === PG.CHECK_VIOLATION) {
      return errorResponse(400, "Stats cannot be negative");
    }
    console.error(`[PATCH /api/players/${id}]`, err);
    return errorResponse(500, "Could not update player");
  }
}
