import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export const dynamic = "force-dynamic"; export const revalidate = 0; export const runtime = "nodejs"
const API = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3333"
const AUTH_COOKIE = process.env.AUTH_COOKIE_NAME || "accessToken"

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const token = (await cookies()).get(AUTH_COOKIE)?.value
  if (!token) return NextResponse.json({ success:false, error:{ message:"Não autenticado" } }, { status:401 })

  const body = await req.json().catch(()=>null)
  const resp = await fetch(`${API}/users/${params.id}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}`, "Content-Type":"application/json" },
    body: JSON.stringify(body),
  })
  let j: any = {}; try { j = await resp.json() } catch {}
  return NextResponse.json({ success: resp.ok, data: j?.data ?? j?.user ?? j }, { status: resp.status })
}
