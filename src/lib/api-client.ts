import type { ApiResponse } from "@/lib/api"; // type-only: nothing server-side is bundled

export async function api<T>(
  url: string,
  init?: RequestInit,
): Promise<ApiResponse<T>> {
  try {
    const res = await fetch(url, {
      ...init,
      headers: { "Content-Type": "application/json", ...init?.headers },
    });
    const json = await res.json().catch(() => null);

    if (json && typeof json.isError === "boolean")
      return json as ApiResponse<T>;
    return {
      isError: true,
      statusCode: res.status,
      message: res.ok
        ? "Unexpected response from the server"
        : `Request failed (${res.status})`,
    };
  } catch {
    return {
      isError: true,
      statusCode: 0,
      message: "Network error. Check your connection and try again.",
    };
  }
}
