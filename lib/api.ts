export const API_URL = process.env.NEXT_PUBLIC_API_URL as string;

type FetchOptions = RequestInit & { auth?: boolean };

export async function api(path: string, options: FetchOptions = {}) {
  const url = `${API_URL}${path}`;
  const headers = new Headers(options.headers || {});
  if (!headers.has("Content-Type")) headers.set("Content-Type", "application/json");

  // inclui cookies (para HttpOnly definidos pelo backend)
  const res = await fetch(url, {
    ...options,
    headers,
    credentials: "include",
    cache: "no-store",
  });

  const ct = res.headers.get("Content-Type") || "";
  const body = ct.includes("application/json") ? await res.json() : await res.text();

  if (!res.ok) {
    const msg = typeof body === "string" ? body : body?.message || body?.error || res.statusText;
    throw new Error(msg);
  }
  return body;
}
