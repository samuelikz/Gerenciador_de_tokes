import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3333";
const AUTH_COOKIE = process.env.AUTH_COOKIE_NAME || "accessToken";

// --- TIPOS DE RESPOSTA (Simplificados) ---
type ListItems = {
  items?: unknown[];
  data?: unknown[];
  success?: boolean;
} & Record<string, unknown>;

async function getAuthToken() {
  const token = (await cookies()).get(AUTH_COOKIE)?.value;
  return token;
}

export async function GET() {
  const token = await getAuthToken(); // ⬅️ Usa a função auxiliar

  if (!token) {
    return NextResponse.json(
      { success: false, error: { message: "Não autenticado" } },
      { status: 401 }
    );
  }

  const resp = await fetch(`${API_BASE}/tokensall`, {
    // ⬅️ Rota para todos os tokens
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    cache: "no-store",
  });

  let body: unknown = {}; // ⬅️ CORREÇÃO: Usando unknown
  try {
    body = await resp.json();
  } catch {}

  // Tipagem para auxiliar na extração
  const bodyAsList = body as ListItems;

  // Extração segura de itens de 'items' ou 'data'. Se nada vier, retorna [].
  const items = Array.isArray(bodyAsList?.items)
    ? bodyAsList.items
    : Array.isArray(bodyAsList?.data)
    ? bodyAsList.data
    : [];

  // Retorna a lista para o Front-end
  return NextResponse.json(
    { success: resp.ok, data: items },
    { status: resp.status }
  );
}
