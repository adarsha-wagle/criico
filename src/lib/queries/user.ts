import "server-only";
import { cache } from "react";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";

/**
 * Wrapped in React cache(): the dashboard renders the user panel twice
 * (desktop sidebar + mobile sheet) but this only hits the DB once per request.
 */
export const getUserById = cache(async (id: string) => {
  const [user] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
    })
    .from(users)
    .where(eq(users.id, id));
  return user ?? null;
});
