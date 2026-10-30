import { type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { players } from "@/db/schema";

import { formatZodError, playerInputSchema } from "@/lib/validation";
import {
  errorResponse,
  PG,
  pgErrorCode,
  readJson,
  requireSession,
  successResponse,
} from "@/lib/api";
import { PLAYER_ROLES, type TPlayerRole } from "@/config/constant";

/* GET /api/players?role=Bowler */

export async function GET(req: NextRequest) {
  // VALIDATE
  const auth = await requireSession();
  if (!auth.ok) return auth.response;

  const roleParam = req.nextUrl.searchParams.get("role");
  if (roleParam && !PLAYER_ROLES.includes(roleParam as TPlayerRole)) {
    return errorResponse(
      400,
      `role must be one of: ${PLAYER_ROLES.join(", ")}`,
    );
  }

  // FETCH FROM DB
  const rows = await db
    .select()
    .from(players)
    .where(roleParam ? eq(players.role, roleParam as TPlayerRole) : undefined)
    .orderBy(asc(players.name));

  // RETURN

  return successResponse(
    { players: rows, count: rows.length },
    "Players fetched successfully",
  );
}

/* POST /api/players ------------------------------------------------ */

export async function POST(req: NextRequest) {
  // Validate  - only admin can create player
  const auth = await requireSession({ admin: true });
  if (!auth.ok) return auth.response;

  const body = await readJson(req);
  if (!body.ok) return body.response;

  const parsed = playerInputSchema.safeParse(body.value);
  if (!parsed.success) {
    const { message, fieldErrors } = formatZodError(parsed.error);
    return errorResponse(400, message, fieldErrors);
  }

  try {
    const [player] = await db.insert(players).values(parsed.data).returning();

    // invalid the cached data
    revalidatePath("/dashboard/players");
    revalidatePath("/dashboard/leaderboard");

    return successResponse({ player }, "Player created successfully", 201, {
      headers: { Location: `/api/players/${player.id}` },
    });
  } catch (err) {
    // DB CHECK constraint
    if (pgErrorCode(err) === PG.CHECK_VIOLATION) {
      return errorResponse(400, "Stats cannot be negative");
    }
    console.error("[POST /api/players]", err);
    return errorResponse(500, "Could not create player");
  }
}
