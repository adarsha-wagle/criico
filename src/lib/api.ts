import { NextResponse, type NextRequest } from "next/server";

export type TErrorBody = {
  error: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

type TResult<T> =
  | { ok: true; value: T }
  | { ok: false; response: NextResponse };

export const errorResponse = (status: number, body: TErrorBody) =>
  NextResponse.json(body, { status });

export async function readJson(req: NextRequest): Promise<TResult<unknown>> {
  try {
    return { ok: true, value: await req.json() };
  } catch {
    return {
      ok: false,
      response: errorResponse(400, {
        error: "Request body must be valid JSON",
      }),
    };
  }
}

export const PG = {
  CHECK_VIOLATION: "23514",
  UNIQUE_VIOLATION: "23505",
  FK_VIOLATION: "23503",
} as const;

export function pgErrorCode(err: unknown): string | undefined {
  const e = err as { code?: string; cause?: { code?: string } } | null;
  return e?.code ?? e?.cause?.code;
}
