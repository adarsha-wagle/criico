import { env } from "@/config/env";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

/**
 * Pure JWT helpers: no `next/headers`, so this file is safe to import in middleware.ts.
 * jose uses Web Crypto, which works in the Edge runtime (jsonwebtoken does not).
 */

export interface Session {
  userId: string;
  role: "admin" | "viewer";
}

function getSecret(): Uint8Array {
  const secret = env.JWT_SECRET;
  return new TextEncoder().encode(secret);
}

export async function signToken(session: Session): Promise<string> {
  return new SignJWT({ role: session.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(session.userId)
    .setIssuedAt()
    .setExpirationTime(`${env.MAX_AGE_SECONDS}s`)
    .sign(getSecret());
}

/** Returns null for a missing, expired, tampered or malformed token. Never throws. */
export async function verifyToken(
  token: string | undefined,
): Promise<Session | null> {
  if (!token) return null;
  try {
    // Pin the algorithm so a token signed with "none" or another alg is rejected.
    const { payload } = await jwtVerify(token, getSecret(), {
      algorithms: ["HS256"],
    });
    if (typeof payload.sub !== "string") return null;
    return {
      userId: payload.sub,
      role: payload.role === "admin" ? "admin" : "viewer",
    };
  } catch {
    return null;
  }
}

export async function getSession(): Promise<Session | null> {
  const store = await cookies();
  return verifyToken(store.get(env.AUTH_COOKIE)?.value);
}

export async function setAuthCookie(token: string): Promise<void> {
  console.log("setting auth cookie");
  const store = await cookies();
  store.set(env.AUTH_COOKIE, token, {
    httpOnly: true, // not readable from JS, so an XSS bug can't steal it
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: env.MAX_AGE_SECONDS,
  });
}

export async function clearAuthCookie(): Promise<void> {
  const store = await cookies();
  store.delete(env.AUTH_COOKIE);
}
