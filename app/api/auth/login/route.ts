import { NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL!;
const COOKIE_NAME = process.env.AUTH_COOKIE_NAME || "accessToken";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    const res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const payload = await res.json().catch(() => ({}));

    if (!res.ok) {
      const message =
        payload?.message ||
        payload?.error?.message ||
        "Falha no login";
      return NextResponse.json({ success: false, message }, { status: res.status });
    }

    // Sua API: { success: true, data: { access_token, token_type, expires_in } }
    const token: string | undefined =
      payload?.data?.access_token ?? payload?.access_token;

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Token ausente na resposta do servidor." },
        { status: 500 }
      );
    }

    const reply = NextResponse.json({ success: true });

    reply.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax", // prod com domínios diferentes: 'none' + secure:true + HTTPS
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60, // 1h
    });

    return reply;
  } catch {
    return NextResponse.json(
      { success: false, message: "Erro inesperado ao autenticar" },
      { status: 500 }
    );
  }
}
