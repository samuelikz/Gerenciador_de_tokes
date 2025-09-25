export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3333";
const AUTH_COOKIE = process.env.AUTH_COOKIE_NAME || "accessToken";

export async function GET() {
  const token = (await cookies()).get(AUTH_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ success: false, error: { message: "Não autenticado" } }, { status: 401 });
  }

  const resp = await fetch(`${API_BASE}/tokens`, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    cache: "no-store",
  });

  let body: any = {};
  try { body = await resp.json(); } catch {}

  // backend: { meta, items }. Normaliza para { success, data }
  const items = Array.isArray(body?.items) ? body.items : [];
  return NextResponse.json({ success: resp.ok, data: items }, { status: resp.status });
}

export async function POST(req: NextRequest) {
  const token = (await cookies()).get(AUTH_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ success: false, error: { message: "Não autenticado" } }, { status: 401 });
  }

  const json = await req.json().catch(() => null);
  if (!json?.scope) {
    return NextResponse.json({ success: false, error: { message: "scope é obrigatório" } }, { status: 400 });
  }

  const resp = await fetch(`${API_BASE}/tokens`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(json),
  });

  let body: any = {};
  try { body = await resp.json(); } catch {}
  // repassa como { success, ...body }
  return NextResponse.json({ success: resp.ok, ...body }, { status: resp.status });
}

export async function DELETE(req: NextRequest) {
  const token = (await cookies()).get(AUTH_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ success: false, error: { message: "Não autenticado" } }, { status: 401 });
  }

  const json = await req.json().catch(() => null);
  if (!json?.tokenId) {
    return NextResponse.json({ success: false, error: { message: "tokenId obrigatório" } }, { status: 400 });
  }

  const resp = await fetch(`${API_BASE}/tokens`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ tokenId: json.tokenId }),
  });

  let body: any = {};
  try { body = await resp.json(); } catch {}
  return NextResponse.json({ success: resp.ok, ...body }, { status: resp.status });
}
