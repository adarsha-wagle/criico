import { type NextRequest } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import {
  errorResponse,
  PG,
  pgErrorCode,
  readJson,
  successResponse,
} from "@/lib/api";
import { setAuthCookie, signToken } from "@/lib/jwt";
import { hashPassword } from "@/lib/password";
import { formatZodError } from "@/lib/validation/shared";
import { registerSchema } from "@/lib/validation/auth";

export async function POST(req: NextRequest) {
  const body = await readJson(req);
  if (!body.ok) return body.response;

  const parsed = registerSchema.safeParse(body.value);
  if (!parsed.success) {
    const { message, fieldErrors } = formatZodError(parsed.error);
    return errorResponse(400, message, fieldErrors);
  }
  const { name, email, password } = parsed.data;

  try {
    // By default role is viewer and admins are created via scripts/create-admin.ts
    const [user] = await db
      .insert(users)
      .values({ name, email, passwordHash: await hashPassword(password) })
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
      });

    // Log the new user directly.
    const token = await signToken({ userId: String(user.id), role: user.role });
    await setAuthCookie(token);

    return successResponse({ user }, "Account Created Successfully.", 201);
  } catch (err) {
    if (pgErrorCode(err) === PG.UNIQUE_VIOLATION) {
      return errorResponse(409, "An account with this email already exists", {
        email: ["An account with this email already exists"],
      });
    }
    console.error("[POST /api/auth/register]", err);
    return errorResponse(500, "Could not create account");
  }
}
