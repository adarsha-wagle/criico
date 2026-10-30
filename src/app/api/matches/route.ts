import {
  errorResponse,
  PG,
  pgErrorCode,
  readJson,
  requireSession,
  successResponse,
  pgConstraint,
} from "@/lib/api";
import {
  listMatches,
  MatchInputError,
  recordMatch,
} from "@/lib/queries/matches";
import { matchInputSchema } from "@/lib/validation/matches";
import { formatZodError } from "@/lib/validation/shared";
import { revalidatePath } from "next/cache";
import { NextRequest } from "next/server";

export async function GET() {
  const auth = await requireSession();
  if (!auth.ok) return auth.response;

  const items = await listMatches();
  return successResponse(
    { matches: items, count: items.length },
    "Matches Fetched Successfully.",
  );
}

export async function POST(req: NextRequest) {
  const auth = await requireSession({ admin: true });
  if (!auth.ok) return auth.response;

  const body = await readJson(req);
  if (!body.ok) return body.response;

  const parsed = matchInputSchema.safeParse(body.value);
  if (!parsed.success) {
    const { message, fieldErrors } = formatZodError(parsed.error);
    return errorResponse(400, message, fieldErrors);
  }

  try {
    const match = await recordMatch(parsed.data, auth.value.userId);

    // Player totals changed, so every page showing scores is stale.
    revalidatePath("/dashboard", "layout");
    revalidatePath("/");

    return successResponse({ match }, "Match recorded successfully", 201);
  } catch (err) {
    if (err instanceof MatchInputError) return errorResponse(400, err.message);
    if (pgErrorCode(err) === PG.CHECK_VIOLATION)
      return errorResponse(400, checkMessage(pgConstraint(err)));
    console.error("[POST /api/matches]", err);
    return errorResponse(500, "Could not record the match");
  }
}

/** The DB checks are the last line of defence; Zod normally catches these first. */
function checkMessage(constraint: string | undefined): string {
  switch (constraint) {
    case "matches_distinct_teams":
      return "Team A and Team B must be different";
    case "matches_valid_winner":
      return "The winner must be one of the two teams";
    case "matches_valid_result":
      return "A completed match needs a winner, and a draw cannot have one";
    default:
      return "Runs and wickets cannot be negative";
  }
}
