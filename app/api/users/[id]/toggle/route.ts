import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

const API = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3333";
const AUTH_COOKIE = process.env.AUTH_COOKIE_NAME || "accessToken";

/**
 * Handler responsável por receber o PATCH da client page,
 * repassar o token do cookie e encaminhar para a API externa.
 */
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  console.log(`[PROXY] 1. PATCH recebido → ID: ${id}`);

  // Busca o token armazenado nos cookies
  const token = (await cookies()).get(AUTH_COOKIE)?.value;
  if (!token) {
    console.warn("[PROXY] 2. Falha de autenticação → token ausente");
    return NextResponse.json(
      { success: false, error: { message: "Não autenticado" } },
      { status: 401 }
    );
  }

  const body = await req.json().catch(() => null);
  const targetUrl = `${API}/users/${id}/toggle`;
  console.log(`[PROXY] 3. Encaminhando PATCH para: ${targetUrl}`);
  console.log("[PROXY] 3b. Corpo enviado:", body);

  try {
    const resp = await fetch(targetUrl, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      redirect: "manual", // Evita redirecionamentos 30x automáticos
      body: JSON.stringify(body),
    });

    console.log(`[PROXY] 4. API respondeu com status: ${resp.status}`);

    if (resp.status === 307 || resp.status === 302) {
      console.error(`[PROXY] 5. Redirecionamento bloqueado (${resp.status})`);
      return NextResponse.json(
        {
          success: false,
          error: {
            message: `Redirecionamento detectado (${resp.status}). Verifique a rota da API.`,
          },
        },
        { status: 400 }
      );
    }

    let jsonResponse: any = {};
    try {
      jsonResponse = await resp.json();
      console.log("[PROXY] 6. Corpo JSON recebido da API:", jsonResponse);
    } catch {
      console.warn("[PROXY] 6b. Resposta sem corpo JSON (pode ser 204).");
    }

    return NextResponse.json(
      {
        success: resp.ok,
        data: jsonResponse?.data ?? jsonResponse?.user ?? jsonResponse,
      },
      { status: resp.status }
    );
  } catch (error) {
    console.error("[PROXY] 7. Erro de conexão/fetch:", error);
    return NextResponse.json(
      { success: false, error: { message: "Erro de rede ou proxy." } },
      { status: 500 }
    );
  }
}
