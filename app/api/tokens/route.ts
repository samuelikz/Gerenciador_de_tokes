import { NextResponse, NextRequest } from "next/server";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3333";
const AUTH_COOKIE = process.env.AUTH_COOKIE_NAME || "accessToken";

type ApiToken = unknown; 
type ListItems = { items?: ApiToken[]; data?: ApiToken[]; success?: boolean } & Record<string, unknown>;

async function getAuthToken() {
    return (await cookies()).get(AUTH_COOKIE)?.value;
}

export async function GET() {
    const token = await getAuthToken(); 
    
    if (!token) {
        return NextResponse.json({ success: false, error: { message: "Não autenticado" } }, { status: 401 });
    }

    const resp = await fetch(`${API_BASE}/tokens`, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
        cache: "no-store",
    });

    let body: unknown = {};
    try { body = await resp.json(); } catch {}

    const bodyAsList = body as ListItems;
    const items = Array.isArray(bodyAsList?.items) ? bodyAsList.items : [];
    
    return NextResponse.json({ success: resp.ok, data: items }, { status: resp.status });
}

export async function POST(req: NextRequest) {
    const token = await getAuthToken();
    
    if (!token) {
        return NextResponse.json({ success: false, error: { message: "Não autenticado" } }, { status: 401 });
    }

    const json: { scope?: string, [key: string]: unknown } | null = await req.json().catch(() => null);
    if (!json?.scope) {
        return NextResponse.json({ success: false, error: { message: "scope é obrigatório" } }, { status: 400 });
    }

    const resp = await fetch(`${API_BASE}/tokens`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(json),
    });

    let body: unknown = {};
    try { body = await resp.json(); } catch {}
    
    return NextResponse.json({ success: resp.ok, ...body as Record<string, unknown> }, { status: resp.status });
}

export async function DELETE(req: NextRequest) {
    const token = await getAuthToken(); // ⬅️ Contorno aplicado

    if (!token) {
        return NextResponse.json({ success: false, error: { message: "Não autenticado" } }, { status: 401 });
    }

    const json: { tokenId?: string } | null = await req.json().catch(() => null);
    if (!json?.tokenId) {
        return NextResponse.json({ success: false, error: { message: "tokenId obrigatório" } }, { status: 400 });
    }

    const resp = await fetch(`${API_BASE}/tokens`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ tokenId: json.tokenId }),
    });

    let body: unknown = {};
    try { body = await resp.json(); } catch {}
    
    return NextResponse.json({ success: resp.ok, ...body as Record<string, unknown> }, { status: resp.status });
}