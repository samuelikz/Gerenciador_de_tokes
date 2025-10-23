import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL!;
const COOKIE_NAME = process.env.AUTH_COOKIE_NAME || "accessToken";
const SECURE_COOKIES = (process.env.COOKIE_SECURE ?? "false") === "true";

export async function POST(req: Request) {
  const { email, password } = await req.json();

  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
    cache: "no-store",
  });

  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = payload?.message || payload?.error?.message || `Falha no login (HTTP ${res.status})`;
    return NextResponse.json({ success: false, message }, { status: res.status });
  }

  const token: string | undefined =
    payload?.data?.access_token ??
    payload?.access_token ??
    payload?.data?.token ??
    payload?.token ??
    payload?.data?.accessToken ??
    payload?.accessToken;

  if (!token) {
    return NextResponse.json({ success: false, message: "Token ausente na resposta" }, { status: 500 });
  }

  const reply = NextResponse.json({ success: true });

  reply.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",       
    secure: SECURE_COOKIES, 
    path: "/",
    maxAge: 60 * 60,
  });

  return reply;
}
