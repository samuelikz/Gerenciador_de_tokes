"use client";

import * as React from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  IconMail,
  IconBriefcase,
  IconCalendar,
  IconEdit,
} from "@tabler/icons-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import EditProfileForm from "@/components/edit-profile";

// --- TIPOS DE DADOS ---
type Role = "ADMIN" | "USER";
type UserData = {
  id: string | number;
  email?: string;
  role?: string;
  name?: string;
  avatar?: string | null;
  createdAt?: string;
  // Adicione outras propriedades necessárias para PATCH
};
type MeResponse = | { success: true; data: UserData } | { success: false; message: string };

function getErrorMessage(err: unknown, fallback = "Ocorreu um erro"): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  return fallback;
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

// Assumindo que readJson está definido globalmente ou importado
async function readJson<T>(res: Response): Promise<T | null> {
    try { return (await res.json()) as T } catch { return null }
}


export default function PerfilPage() {
  const [me, setMe] = React.useState<UserData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [openEdit, setOpenEdit] = React.useState(false); 

  // 🛑 FUNÇÃO CENTRALIZADA DE RECARGA: Extrai a lógica do useEffect
  const reloadProfile = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/users/me/profile`, {
        credentials: "include",
        cache: "no-store",
      });

      const json = (await readJson<MeResponse>(res)) || ({ success: false } as MeResponse);

      if (json.success) {
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
        toast.error("Sessão expirada. Faça login novamente.");
      }
    } catch (e) {
      toast.error(getErrorMessage(e, "Erro ao carregar perfil."));
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    reloadProfile();
  }, [reloadProfile]);

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

  // Se o usuário não for carregado, não renderiza
  if (!me && !loading) {
      return (
          <div className="flex flex-col gap-6 px-4 lg:px-6">
              <h1 className="text-3xl font-semibold text-red-500">Erro de Acesso</h1>
              <p className="text-muted-foreground">Não foi possível carregar os dados do seu perfil. Tente recarregar a página.</p>
          </div>
      );
  }

  return (
    <div className="flex flex-col gap-6 px-4 lg:px-6">
      <h1 className="text-3xl font-semibold">Minha Conta</h1>

      <Card className="w-full max-w-lg mx-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={me?.avatar || "/avatars/shadcn.jpg"} alt={me?.name || "Usuário"} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-xl">
                  {loading ? "Carregando..." : me?.name || "Usuário"}
                </CardTitle>
                <p className="text-sm text-muted-foreground">{me?.email}</p>
              </div>
            </div>
            {/* Botão de Edição que abre o modal */}
            <Dialog open={openEdit} onOpenChange={setOpenEdit}>
              <DialogTrigger asChild>
                <Button variant="outline" size="icon" className="shrink-0">
                    <IconEdit className="size-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Editar Perfil</DialogTitle>
                </DialogHeader>
                {/* 🛑 COMPONENTE FILHO INJETADO AQUI */}
                <EditProfileForm 
                    initialData={me} 
                    onSuccess={() => {
                        setOpenEdit(false);
                        reloadProfile(); // Recarrega os dados APÓS edição
                    }} 
                />
              </DialogContent>
            </Dialog>
            {/* Fim do Modal */}
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
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ----------------------------------------------------
// 🛑 NOVO ARQUIVO: components/edit-profile-form.jsx
// ----------------------------------------------------