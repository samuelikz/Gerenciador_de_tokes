import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export const dynamic = "force-dynamic"
export const revalidate = 0
export const runtime = "nodejs"

const API = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3333"
const AUTH_COOKIE = process.env.AUTH_COOKIE_NAME || "accessToken"

export async function GET() {
  const token = (await cookies()).get(AUTH_COOKIE)?.value
  if (!token) return NextResponse.json({ success:false, error:{ message:"Não autenticado" } }, { status:401 })

  const resp = await fetch(`${API}/users/me/profile`, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    cache: "no-store",
  })
  let body: any = {}; try { body = await resp.json() } catch {}
  const items = Array.isArray(body?.items) ? body.items : (Array.isArray(body?.data) ? body.data : body)
  return NextResponse.json({ success: resp.ok, data: items }, { status: resp.status })
}