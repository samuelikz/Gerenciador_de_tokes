// /lib/me.ts
import { getAuthToken } from "@/lib/auth";

export type MeData = {
  id: string | number;
  email: string;
  name?: string;
  role?: string;
  avatar?: string | null;
};

export type MeResponse =
  | { success: true; data: MeData }
  | { success: false; message: string };

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL!; // ex.: http://localhost:3321

export async function fetchMe(): Promise<MeResponse> {
  const token = getAuthToken();
  if (!token) return { success: false, message: "Token ausente" };

  const res = await fetch(`${API_URL}/users/me`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
    credentials: "omit",
  });

  const json = await res.json().catch(() => ({ message: "JSON inválido" }));
  if (!res.ok) {
    const message = json?.message || "Falha ao carregar usuário";
    return { success: false, message };
  }

  // envelope { success, data } ou direto
  const d = json?.data ?? json;

  const normalized: MeData = {
    id: d.id,
    email: d.email,
    name: d.name ?? (d.email ? d.email.split("@")[0] : undefined),
    role: d.role,
    avatar: d.avatar ?? null,
  };

  return { success: true, data: normalized };
}
