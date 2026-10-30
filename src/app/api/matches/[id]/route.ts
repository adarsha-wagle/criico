import { type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import {
  errorResponse,
  PG,
  pgConstraint,
  pgErrorCode,
  readJson,
  requireSession,
  successResponse,
} from "@/lib/api";
import {
  getMatchById,
  matchCheckMessage,
  MatchInputError,
  MatchNotFoundError,
  updateMatch,
} from "@/lib/queries/matches";
import { matchInputSchema } from "@/lib/validation/matches";
import { formatZodError, id } from "@/lib/validation/shared";

// `params` is a Promise and must be awaited.
type Ctx = { params: Promise<{ id: string }> };

const matchIdSchema = id("match id");

/** A malformed id would make Postgres throw "invalid input syntax for type uuid" (a 500). Catch it as a 400. */
async function parseId(ctx: Ctx) {
  const parsed = matchIdSchema.safeParse((await ctx.params).id);
  return parsed.success ? parsed.data : null;
}

/* GET /api/matches/[id] -------------------------------------------- */

export async function GET(_req: NextRequest, ctx: Ctx) {
  const auth = await requireSession();
  if (!auth.ok) return auth.response;

  const matchId = await parseId(ctx);
  if (!matchId) return errorResponse(400, "Invalid match id");

  const match = await getMatchById(matchId);
  if (!match) return errorResponse(404, "Match not found");

  return successResponse({ match }, "Match fetched successfully");
}

/* PATCH /api/matches/[id] ------------------------------------------ */
/* Replaces the match and re-applies player totals (see updateMatch). */

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const auth = await requireSession({ admin: true });
  if (!auth.ok) return auth.response;

  const matchId = await parseId(ctx);
  if (!matchId) return errorResponse(400, "Invalid match id");

  const body = await readJson(req);
  if (!body.ok) return body.response;

  const parsed = matchInputSchema.safeParse(body.value);
  if (!parsed.success) {
    const { message, fieldErrors } = formatZodError(parsed.error);
    return errorResponse(400, message, fieldErrors);
  }

  try {
    const match = await updateMatch(matchId, parsed.data);

    // Player totals changed, so every page showing scores is stale.
    revalidatePath("/dashboard", "layout");
    revalidatePath("/");

    return successResponse({ match }, "Match updated successfully");
  } catch (err) {
    if (err instanceof MatchNotFoundError)
      return errorResponse(404, err.message);
    if (err instanceof MatchInputError) return errorResponse(400, err.message);
    if (pgErrorCode(err) === PG.CHECK_VIOLATION)
      return errorResponse(400, matchCheckMessage(pgConstraint(err)));
    console.error(`[PATCH /api/matches/${matchId}]`, err);
    return errorResponse(500, "Could not update the match");
  }
}
