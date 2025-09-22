// app/api/tokens/route.ts
import { cookies } from "next/headers"
import { NextResponse, type NextRequest } from "next/server"

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3011"
const AUTH_COOKIE = process.env.AUTH_COOKIE_NAME || "accessToken"

// GET: lista tokens
export async function GET() {
  const token = (await cookies()).get(AUTH_COOKIE)?.value
  if (!token) {
    return NextResponse.json(
      { success: false, error: { message: "Não autenticado" } },
      { status: 401 }
    )
  }

  const resp = await fetch(`${API_BASE}/tokens`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  })
  const body = await resp.json().catch(() => ({}))
  return NextResponse.json(body, { status: resp.status })
}

// POST: cria token
export async function POST(req: NextRequest) {
  const token = (await cookies()).get(AUTH_COOKIE)?.value
  if (!token) {
    return NextResponse.json(
      { success: false, error: { message: "Não autenticado" } },
      { status: 401 }
    )
  }

  const json = (await req.json().catch(() => null)) as
    | { scope?: string; expiresAt?: string | null; description?: string | null }
    | null

  if (!json?.scope) {
    return NextResponse.json(
      { success: false, error: { message: "scope é obrigatório" } },
      { status: 400 }
    )
  }

  const resp = await fetch(`${API_BASE}/tokens`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(json),
  })
  const body = await resp.json().catch(() => ({}))
  return NextResponse.json(body, { status: resp.status })
}

// DELETE: revoga token
export async function DELETE(req: NextRequest) {
  const token = (await cookies()).get(AUTH_COOKIE)?.value
  if (!token) {
    return NextResponse.json(
      { success: false, error: { message: "Não autenticado" } },
      { status: 401 }
    )
  }

  const json = (await req.json().catch(() => null)) as { tokenId?: string } | null
  if (!json?.tokenId) {
    return NextResponse.json(
      { success: false, error: { message: "tokenId obrigatório" } },
      { status: 400 }
    )
  }

  const resp = await fetch(`${API_BASE}/tokens`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ tokenId: json.tokenId }),
  })
  const body = await resp.json().catch(() => ({}))
  return NextResponse.json(body, { status: resp.status })
}
