import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { asc } from "drizzle-orm";
import { db } from "@/db";
import { players } from "@/db/schema";

import { formatZodError, playerInputSchema } from "@/lib/validation";
import { errorResponse, readJson } from "@/lib/api";

/* GET /api/players?role=Bowler ------------------------------------- */

export async function GET(req: NextRequest) {
  const rows = await db.select().from(players).orderBy(asc(players.name));

  return NextResponse.json({ players: rows });
}

/* POST /api/players ------------------------------------------------ */

export async function POST(req: NextRequest) {
  const body = await readJson(req);
  if (!body.ok) return body.response;

  // Validate inputs
  const parsed = playerInputSchema.safeParse(body.value);

  if (!parsed.success) {
    const { message, fieldErrors } = formatZodError(parsed.error);
    return errorResponse(400, { error: message, fieldErrors });
  }

  try {
    const [player] = await db.insert(players).values(parsed.data).returning();

    revalidatePath("/dashboard/players");
    revalidatePath("/dashboard/leaderboard");

    return NextResponse.json(
      { player },
      { status: 201, headers: { Location: `/api/players/${player.id}` } },
    );
  } catch (err) {
    // DB CHECK constraint = last line of defence if validation is ever bypassed.
  }
}
