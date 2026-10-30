/**
 * Create an admin, or promote an existing user to admin.
 *
 *   npm run create-admin -- admin@criico.com "admin123" "Admin"
 *   (or set ADMIN_EMAIL / ADMIN_PASSWORD / ADMIN_NAME in .env and run with no args)
 *
 * Safe to run repeatedly: if the email exists, it's promoted to admin and its password reset.
 * Builds its own Pool because src/db/index.ts imports `server-only`.
 */
import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import bcrypt from "bcryptjs";
import * as schema from "../src/db/schema";
import { registerSchema } from "../src/lib/validation/auth";

const [argEmail, argPassword, argName] = process.argv.slice(2);

const parsed = registerSchema.safeParse({
  email: argEmail ?? process.env.ADMIN_EMAIL,
  password: argPassword ?? process.env.ADMIN_PASSWORD,
  name: argName ?? process.env.ADMIN_NAME ?? "Admin",
});
if (!parsed.success) {
  console.error(
    "✘",
    parsed.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("\n  "),
  );
  process.exit(1);
}
const { email, password, name } = parsed.data;

const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL,
});
const db = drizzle(pool, { schema });

async function main() {
  const passwordHash = await bcrypt.hash(password, 12);

  const [user] = await db
    .insert(schema.users)
    .values({ email, name, passwordHash, role: "admin" })
    .onConflictDoUpdate({
      target: schema.users.email,
      set: { role: "admin", passwordHash, name },
    })
    .returning({
      id: schema.users.id,
      email: schema.users.email,
      role: schema.users.role,
    });

  console.log(`✔ ${user.email} is now ${user.role} (id ${user.id})`);
}

main()
  .catch((err) => {
    console.error("✘ Failed:", err.message ?? err);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
