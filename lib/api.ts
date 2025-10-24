// app/api/_lib/apiFetch.ts
import { cookies } from "next/headers";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3333";
const AUTH_COOKIE = process.env.AUTH_COOKIE_NAME || "accessToken";

export async function apiFetch(path: string, init: RequestInit = {}) {
  const token = (await cookies()).get(AUTH_COOKIE)?.value; // cookies() é síncrono
  if (!token) {
    return new Response(
      JSON.stringify({ success: false, error: { message: "Não autenticado" } }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  const headers = new Headers(init.headers);
  if (!headers.has("Authorization")) headers.set("Authorization", `Bearer ${token}`);
  if (!headers.has("Accept")) headers.set("Accept", "application/json");

  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
    cache: "no-store",
  });

  // Lê como texto e tenta fazer parse de JSON de forma segura
  const raw = await res.text().catch(() => "");
  let data: unknown = null;
  try {
    data = raw ? JSON.parse(raw) : null;
  } catch {
    data = { raw };
  }

  return new Response(JSON.stringify(data), {
    status: res.status,
    headers: { "Content-Type": "application/json" },
  });
}
