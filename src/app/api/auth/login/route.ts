import { type NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { errorResponse, readJson, successResponse } from "@/lib/api";
import { setAuthCookie, signToken } from "@/lib/jwt";
import { verifyPassword } from "@/lib/password";
import { loginSchema } from "@/lib/validation/auth";
import { formatZodError } from "@/lib/validation/shared";

// POST api/auth/login
export async function POST(req: NextRequest) {
  // Validate
  const body = await readJson(req);
  if (!body.ok) return body.response;
  const parsed = loginSchema.safeParse(body.value);
  if (!parsed.success) {
    const { message, fieldErrors } = formatZodError(parsed.error);
    return errorResponse(400, message, fieldErrors);
  }
  const { email, password } = parsed.data;

  // Fetch From Db
  const user = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  // Always run bcrypt (against a dummy hash if the user doesn't exist), and return the same message either for email/password

  const valid = await verifyPassword(password, user?.passwordHash);
  // Return Error if user/password don't match
  if (!user || !valid) {
    return errorResponse(401, "Invalid email or password");
  }

  const token = await signToken({ userId: String(user.id), role: user.role });
  console.log("setting cookie");
  // Set http-only cookie
  await setAuthCookie(token);

  // Return the response along with token
  return successResponse(
    {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
    },
    "Logged in successfully",
  );
}
