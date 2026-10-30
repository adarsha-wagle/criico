import { type NextRequest } from "next/server";
import { errorResponse, requireSession, successResponse } from "@/lib/api";
import { leaderboardQuerySchema } from "@/lib/validation/leaderboard";
import { formatZodError } from "@/lib/validation/shared";
import { getLeaderboard } from "@/lib/queries/leaderboard";

/* GET /api/leaderboard?role=Bowler&limit=10 -------------------------- */
/* Players sorted by Impact Score (highest first), with rank + breakdown. */

export async function GET(req: NextRequest) {
  const auth = await requireSession();
  if (!auth.ok) return auth.response;

  // Missing params become undefined, so zod applies the defaults (limit = 50).
  const sp = req.nextUrl.searchParams;
  const parsed = leaderboardQuerySchema.safeParse({
    role: sp.get("role") ?? undefined,
    limit: sp.get("limit") ?? undefined,
  });
  if (!parsed.success) {
    const { message, fieldErrors } = formatZodError(parsed.error);
    return errorResponse(400, message, fieldErrors);
  }

  try {
    const leaderboard = await getLeaderboard(parsed.data);
    return successResponse(
      { leaderboard, count: leaderboard.length },
      "Leaderboard fetched successfully",
    );
  } catch (err) {
    console.error("[GET /api/leaderboard]", err);
    return errorResponse(500, "Could not load leaderboard");
  }
}
