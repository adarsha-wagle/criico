import { NextResponse, type NextRequest } from "next/server";
import { getSession, type Session } from "@/lib/jwt";

/* ------------------------------------------------------------------ */
/* Response envelope: every API route returns one of these two shapes  */
/* ------------------------------------------------------------------ */

export type FieldErrors = Record<string, string[] | undefined>;

export interface ApiSuccess<T> {
  isError: false;
  statusCode: number;
  message: string;
  data: T;
}

export interface ApiError {
  isError: true;
  statusCode: number;
  message: string;
  errors?: FieldErrors; // per-field validation messages, when relevant
}

/** Use on the client: `const json: ApiResponse<{ player: Player }> = await res.json()` */
export type ApiResponse<T> = ApiSuccess<T> | ApiError;

/**
 * statusCode in the body always matches the HTTP status, because both come from
 * the same argument. Clients can branch on `isError` without checking res.ok.
 */
export function successResponse<T>(
  data: T,
  message = "Success",
  statusCode = 200,
  init?: Omit<ResponseInit, "status">,
) {
  const body: ApiSuccess<T> = { isError: false, statusCode, message, data };
  return NextResponse.json(body, { ...init, status: statusCode });
}

export function errorResponse(
  statusCode: number,
  message: string,
  errors?: FieldErrors,
) {
  const body: ApiError = {
    isError: true,
    statusCode,
    message,
    ...(errors && { errors }),
  };
  return NextResponse.json(body, { status: statusCode });
}

/* ------------------------------------------------------------------ */
/* Guards                                                              */
/* ------------------------------------------------------------------ */

type Result<T> = { ok: true; value: T } | { ok: false; response: NextResponse };

/**
 * Middleware only guards /dashboard pages. API routes can be called directly
 * (curl, Postman), so every handler checks the session again.
 */
export async function requireSession(
  opts: { admin?: boolean } = {},
): Promise<Result<Session>> {
  const session = await getSession();
  if (!session)
    return { ok: false, response: errorResponse(401, "Not authenticated") };
  if (opts.admin && session.role !== "admin") {
    return { ok: false, response: errorResponse(403, "Admins only") };
  }
  return { ok: true, value: session };
}

export async function readJson(req: NextRequest): Promise<Result<unknown>> {
  try {
    return { ok: true, value: await req.json() };
  } catch {
    return {
      ok: false,
      response: errorResponse(400, "Request body must be valid JSON"),
    };
  }
}

// Postgres Errors
/** Postgres error codes we map to 4xx. Drizzle may wrap the driver error in `cause`. */
export const PG = {
  CHECK_VIOLATION: "23514",
  UNIQUE_VIOLATION: "23505",
  FK_VIOLATION: "23503",
} as const;

export function pgErrorCode(err: unknown): string | undefined {
  const e = err as { code?: string; cause?: { code?: string } } | null;
  return e?.code ?? e?.cause?.code;
}

export function pgConstraint(err: unknown): string | undefined {
  const e = err as {
    constraint?: string;
    cause?: { constraint?: string };
  } | null;
  return e?.constraint ?? e?.cause?.constraint;
}
