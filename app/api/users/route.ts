import { NextResponse, NextRequest } from "next/server";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

const API = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3333";
const AUTH_COOKIE = process.env.AUTH_COOKIE_NAME || "accessToken";

async function getAuthToken() {
  const token = (await cookies()).get(AUTH_COOKIE)?.value;
  return token;
}

// --- TIPOS DE CORPO ---
type UserData = unknown;
type ListItems = {
  items?: UserData[];
  data?: UserData[];
  success?: boolean;
} & Record<string, unknown>;
type UserBody = { scope?: string; tokenId?: string; [key: string]: unknown };

export async function GET() {
  const token = await getAuthToken();

  if (!token) {
    return NextResponse.json(
      { success: false, error: { message: "Não autenticado" } },
      { status: 401 }
    );
  }

  const resp = await fetch(`${API}/users`, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    cache: "no-store",
  });

  let body: unknown = {}; 
  try {
    body = await resp.json();
  } catch {}

  const bodyAsList = body as ListItems; 

  // Normaliza para array de itens
  const items = Array.isArray(bodyAsList?.items)
    ? bodyAsList.items
    : Array.isArray(bodyAsList?.data)
    ? bodyAsList.data
    : [];

  return NextResponse.json(
    { success: resp.ok, data: items },
    { status: resp.status }
  );
}

export async function POST(req: NextRequest) {
  const token = await getAuthToken(); 

  if (!token) {
    return NextResponse.json(
      { success: false, error: { message: "Não autenticado" } },
      { status: 401 }
    );
  }

  const json = (await req.json().catch(() => null)) as UserBody | null;

  if (!json?.email || !json.name || !json.password) {
    // Adicionando validação básica de campos
    return NextResponse.json(
      {
        success: false,
        error: {
          message: "Dados obrigatórios faltando (nome, e-mail, senha).",
        },
      },
      { status: 400 }
    );
  }

  const resp = await fetch(`${API}/users`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(json),
  });

  let body: unknown = {}; 
  try {
    body = await resp.json();
  } catch {}

  const bodyAsData = body as { data?: UserData; user?: UserData } & Record<
    string,
    unknown
  >;
  const user = bodyAsData?.data ?? bodyAsData?.user ?? body;

  return NextResponse.json(
    { success: resp.ok, data: user },
    { status: resp.status }
  );
}

export async function DELETE(req: NextRequest) {
  const token = await getAuthToken(); 
  if (!token) {
    return NextResponse.json(
      { success: false, error: { message: "Não autenticado" } },
      { status: 401 }
    );
  }


  const json = (await req.json().catch(() => null)) as {
    tokenId?: string;
  } | null;
  if (!json?.tokenId) {
    return NextResponse.json(
      { success: false, error: { message: "tokenId obrigatório" } },
      { status: 400 }
    );
  }

  const resp = await fetch(`${API}/users`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ tokenId: json.tokenId }),
  });

  let body: unknown = {}; 
  try {
    body = await resp.json();
  } catch {}

  return NextResponse.json(
    { success: resp.ok, ...(body as Record<string, unknown>) },
    { status: resp.status }
  );
}
