// app/api/auth/me/route.ts
// (ou src/app/api/auth/me/route.ts, se você usa src/app)

import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL!;
const COOKIE_NAME = process.env.AUTH_COOKIE_NAME || "accessToken";

export async function GET() {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json(
      { success: false, message: "Não autenticado" },
      { status: 401 }
    );
  }

  // Chama sua API Nest para obter o usuário atual
  const res = await fetch(`${API_URL}/me`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  const payload = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message =
      payload?.message || payload?.error?.message || "Falha ao carregar usuário";
    return NextResponse.json({ success: false, message }, { status: res.status });
  }

  // Sua API usa envelope { success, data }
  const data = payload?.data ?? payload;
  return NextResponse.json({ success: true, data });
}
