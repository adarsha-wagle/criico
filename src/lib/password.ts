import bcrypt from "bcryptjs";

const ROUNDS = 10;

export const hashPassword = (plain: string) => bcrypt.hash(plain, ROUNDS);

/**
 * Used when the email doesn't exist, so login takes the SAME time either way.
 * Otherwise an attacker could tell "no such user" (fast) from "wrong password" (slow).
 * Created lazily, once per server instance.
 */
let dummyHash: string | undefined;

export async function verifyPassword(
  plain: string,
  hash: string | null | undefined,
): Promise<boolean> {
  if (!hash) {
    dummyHash ??= await bcrypt.hash("timing-attack-dummy", ROUNDS);
    await bcrypt.compare(plain, dummyHash);
    return false;
  }
  return bcrypt.compare(plain, hash);
}
