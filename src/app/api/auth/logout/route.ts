import { successResponse } from "@/lib/api";
import { clearAuthCookie } from "@/lib/jwt";

export async function POST() {
  // Clear The Cookie
  await clearAuthCookie();
  return successResponse(null, "Logged out successfully.");
}
