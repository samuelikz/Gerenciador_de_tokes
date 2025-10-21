export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3333";
const AUTH_COOKIE = process.env.AUTH_COOKIE_NAME || "accessToken";

export async function GET() {
  const token = (await cookies()).get(AUTH_COOKIE)?.value;
  if (!token) {
    return NextResponse.json(
      { success: false, error: { message: "Não autenticado" } },
      { status: 401 }
    );
  }

  const resp = await fetch(`${API_BASE}/tokensall`, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    cache: "no-store",
  });

  // 🛑 LOG CRÍTICO NO TERMINAL DO SERVIDOR

  let body: any = {};
  try {
    body = await resp.json();
  } catch (e) {
    // Se falhar, é 404, 403, ou resposta vazia
  }
  const items = Array.isArray(body?.items) ? body.items : [];
  return NextResponse.json(
    { success: resp.ok, data: items },
    { status: resp.status }
  );
}
