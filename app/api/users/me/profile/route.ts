import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

const API = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3333";
const AUTH_COOKIE = process.env.AUTH_COOKIE_NAME || "accessToken";

// --- TIPOS DE RESPOSTA (Simplificados) ---
type UserData = { user?: unknown; data?: unknown } & Record<string, unknown>;

// 🛑 FUNÇÃO AUXILIAR PARA CONTORNAR O ERRO DE TIPAGEM DO COOKIES
async function getAuthToken() {
    const token = (await cookies()).get(AUTH_COOKIE)?.value;
    return token
}

export async function GET() {
  const token = await getAuthToken(); // ⬅️ Usa a função auxiliar

  if (!token) {
    return NextResponse.json(
      { success: false, error: { message: "Não autenticado" } },
      { status: 401 }
    );
  }

  const resp = await fetch(`${API}/users/me/profile`, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    cache: "no-store",
  });

  // 🛑 CORREÇÃO ANY: Tipagem segura e unknown
  let body: unknown = {};
  try {
    body = await resp.json();
  } catch {}

  // A API de perfil geralmente retorna um único objeto em 'data' ou na raiz.
  const bodyAsData = body as UserData;
  const user = bodyAsData?.data ?? bodyAsData?.user ?? body;

  // Retorna o objeto de usuário para o Front-end
  return NextResponse.json(
    { success: resp.ok, data: user },
    { status: resp.status }
  );
}
