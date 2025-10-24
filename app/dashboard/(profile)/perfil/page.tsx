"use client";

import * as React from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IconMail, IconBriefcase, IconCalendar, IconEdit } from "@tabler/icons-react";
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
  role?: Role;
  name?: string;
  avatar?: string | null;
  createdAt?: string | number | Date;
};

type MeOk = { success: true; data: UserData };
type MeErr = { success: false; message?: string };
type MeResponse = MeOk | MeErr;

function getErrorMessage(err: unknown, fallback = "Ocorreu um erro"): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  return fallback;
}

type WithToString = { toString(): string };
function fmtDate(d?: unknown) {
  if (d == null) return "—";

  let dt: Date | null = null;

  if (typeof d === "string" || typeof d === "number") {
    dt = new Date(d);
  } else if (d instanceof Date) {
    dt = d;
  } else if (typeof (d as WithToString)?.toString === "function") {
    const s = (d as WithToString).toString();
    dt = new Date(s);
  }

  if (!dt || Number.isNaN(dt.getTime())) return "—";

  try {
    return new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(dt);
  } catch {
    return "—";
  }
}

async function readJson<T>(res: Response): Promise<T | null> {
  try {
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export default function PerfilPage() {
  const [me, setMe] = React.useState<UserData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [openEdit, setOpenEdit] = React.useState(false);

  const reloadProfile = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/users/me/profile`, {
        credentials: "include",
        cache: "no-store",
      });

      const json = (await readJson<MeResponse>(res)) ?? { success: false } as MeErr;

      if ("success" in json && json.success) {
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

  const initials = React.useMemo(() => {
    if (me?.name) {
      const parts = me.name.trim().split(/\s+/).slice(0, 2);
      const ini = parts.map((p) => p[0]?.toUpperCase() ?? "").join("");
      if (ini) return ini;
    }
    if (me?.email?.[0]) return me.email[0].toUpperCase();
    return "U";
  }, [me?.name, me?.email]);

  if (!me && !loading) {
    return (
      <div className="flex flex-col gap-6 px-4 lg:px-6">
        <h1 className="text-3xl font-semibold text-red-500">Erro de Acesso</h1>
        <p className="text-muted-foreground">
          Não foi possível carregar os dados do seu perfil. Tente recarregar a página.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 px-4 lg:px-6">
      <h1 className="text-3xl font-semibold">Minha Conta</h1>

      <Card className="w-full max-w-lg m-none">
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

            <Dialog open={openEdit} onOpenChange={setOpenEdit}>
              <DialogTrigger asChild>
                <Button variant="outline" size="icon" className="shrink-0" aria-label="Editar perfil">
                  <IconEdit className="size-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Editar Perfil</DialogTitle>
                </DialogHeader>
                <EditProfileForm
                  initialData={me}
                  onSuccess={() => {
                    setOpenEdit(false);
                    reloadProfile();
                  }}
                />
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>

        <CardContent className="grid gap-4">
          {loading ? (
            <div className="text-center text-muted-foreground">Carregando...</div>
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
                <span>{fmtDate(me?.createdAt)}</span>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
