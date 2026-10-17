"use client";

const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/v1";

function cookieValue(name: string): string | undefined {
  return document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const method = (init.method ?? "GET").toUpperCase();
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (!["GET", "HEAD", "OPTIONS"].includes(method)) {
    const csrf = cookieValue("campuspass_csrf");
    if (csrf) headers.set("X-CSRF-Token", decodeURIComponent(csrf));
  }
  const response = await fetch(`${apiBase}${path}`, {
    ...init,
    method,
    headers,
    credentials: "include",
    cache: "no-store",
  });
  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as {
      error?: { code?: string; message?: string };
    };
    throw new ApiError(
      response.status,
      payload.error?.code ?? `HTTP_${response.status}`,
      response.status === 401
        ? "Your session is invalid or has expired."
        : (payload.error?.message ?? "The request could not be completed."),
    );
  }
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}
