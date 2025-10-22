"use client";

import * as React from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  IconUserCircle,
  IconMail,
  IconBriefcase,
  IconCalendar,
} from "@tabler/icons-react";

// --- TIPOS DE DADOS ---
type Role = "ADMIN" | "USER";

type UserData = {
  id: string | number;
  email?: string;
  role?: string;
  name?: string;
  avatar?: string | null;
  createdAt?: string; // Adicionado para exibição
};

type MeResponse =
  | { success: true; data: UserData }
  | { success: false; message: string };

// --- FUNÇÕES DE UTILIDADE (Assumindo que existem globalmente ou serão definidas) ---
// Em um projeto real, você precisaria importar essas funções de um arquivo utilitário.

function getErrorMessage(err: unknown, fallback = "Ocorreu um erro"): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  return fallback;
}

async function readJson<T>(res: Response): Promise<T | null> {
  try {
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

function fmtDate(d?: unknown) {
  if (d == null) return "—";
  let dt: Date;
  if (typeof d === "string" || typeof d === "number") dt = new Date(d);
  else if (d instanceof Date) dt = d;
  else if (typeof (d as any)?.toString === "function")
    dt = new Date((d as any).toString());
  else return "—";

  if (Number.isNaN(dt.getTime())) return "—";
  try {
    return new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(dt);
  } catch {
    return "—";
  }
}

export default function PerfilPage() {
  // 🛑 ESTADO DO USUÁRIO
  const [me, setMe] = React.useState<UserData | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        // 1. FETCH para a rota de perfil (proxy para leitura de cookie)
        const res = await fetch(`/api/users/me/profile`, {
          credentials: "include",
          cache: "no-store",
        });

        const json = (await res.json().catch(() => ({}))) as MeResponse;

        if (!mounted) return;

        // 2. PROCESSAMENTO E setMe
        if (json && "success" in json && json.success) {
          const d = json.data;

          setMe({
            id: d.id,
            email: d.email,
            role: d.role,
            name: d.name ?? (d.email ? d.email.split("@")[0] : undefined),
            avatar: d.avatar ?? null,
            createdAt: d.createdAt,
          });
        } else {
          // Se falhar (401, 403, ou sucesso: false), direciona para o login
          toast.error("Sessão expirada. Faça login novamente.");
          // router.replace("/login"); // Adicione roteamento se necessário
        }
      } catch (e) {
        toast.error(getErrorMessage(e, "Erro ao carregar perfil."));
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  // Lógica para obter as iniciais
  const initials = React.useMemo(() => {
    return (
      me?.name
        ?.trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((p) => p[0]?.toUpperCase())
        .join("") ||
      me?.email?.[0]?.toUpperCase() ||
      "U"
    );
  }, [me?.name, me?.email]);

  return (
    <div className="flex flex-col gap-6 px-4 lg:px-6">
      <h1 className="text-3xl font-semibold">Minha Conta</h1>

      <Card className="w-full max-w-lg mx-auto">
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage
                src={me?.avatar || "/avatars/shadcn.jpg"}
                alt={me?.name || "Usuário"}
              />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-xl">
                {loading ? "Carregando..." : me?.name || "Usuário Desconhecido"}
              </CardTitle>
              <p className="text-sm text-muted-foreground">{me?.email}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4">
          {loading ? (
            <div className="text-center text-muted-foreground">
              Carregando detalhes do perfil...
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <IconMail className="size-5 text-primary" />
                <span className="font-medium">E-mail:</span>
                <span>{me?.email || "Não informado"}</span>
              </div>
              <div className="flex items-center gap-3">
                <IconBriefcase className="size-5 text-primary" />
                <span className="font-medium">Papel (Role):</span>
                <span>{me?.role || "USER"}</span>
              </div>
              <div className="flex items-center gap-3">
                <IconCalendar className="size-5 text-primary" />
                <span className="font-medium">Membro desde:</span>
                <span>{fmtDate(me?.createdAt) || "—"}</span>
              </div>

              <div className="mt-4 flex justify-end">
                <Button variant="outline">Editar Perfil</Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
