"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

// --- TIPOS ---
type Role = "ADMIN" | "USER";

type UserData = {
  id: string | number;
  email?: string;
  role?: Role;
  name?: string;
  avatar?: string | null;
};

type MiniUser = { name?: string; email?: string; role?: string };

type MeResponse =
  | { success: true; data: UserData }
  | { success: false; message: string };

interface SiteHeaderProps extends React.ComponentProps<"header"> {
  user?: MiniUser | null;
}

function RoleBadge({ role }: { role?: Role | string }) {
  if (!role) return null;
  return (
    <span className="rounded-full border px-2 py-0.5 text-[10px] font-medium leading-none text-muted-foreground">
      {role}
    </span>
  );
}

// util para parse seguro de JSON
async function readJson<T>(res: Response): Promise<T | null> {
  try {
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export function SiteHeader({ user: userProp, className, ...props }: SiteHeaderProps) {
  const [me, setMe] = React.useState<UserData | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let mounted = true;

    (async () => {
      // Se veio user pelas props, usa e evita o fetch
      if (userProp?.name) {
        const roleFromProps = (userProp.role as Role | undefined) ?? undefined;
        if (mounted) {
          setMe({
            id: "from-props",
            email: userProp.email ?? "",
            name: userProp.name,
            role: roleFromProps,
            avatar: null,
          });
          setLoading(false);
        }
        return;
      }

      try {
        setLoading(true);

        const res = await fetch(`/api/users/me/profile`, {
          credentials: "include",
          cache: "no-store",
        });

        const json = (await readJson<MeResponse>(res)) ?? { success: false, message: "" };

        if (!mounted) return;

        if ("success" in json && json.success) {
          const d = json.data;
          setMe({
            id: d.id,
            email: d.email,
            role: d.role,
            name: d.name ?? (d.email ? d.email.split("@")[0] : undefined),
            avatar: d.avatar ?? null,
          });
        } else {
          setMe(null);
        }
      } catch {
        if (!mounted) return;
        setMe(null);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [userProp]);

  const u = me;

  const displayName = React.useMemo(() => {
    if (u?.name) return u.name;
    if (u?.email) return u.email.split("@")[0] || "Usuário";
    return "Usuário";
  }, [u?.name, u?.email]);

  return (
    <header
      className={[
        "flex shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear",
        "h-[var(--header-height)]",
        "group-has-data-[collapsible=icon]/sidebar-wrapper:h-[var(--header-height)]",
        className ?? "",
      ].join(" ")}
      {...props}
    >
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mx-2 data-[orientation=vertical]:h-4" />

        <h1 className="flex items-center gap-2 text-base font-medium">
          <span>Bem-vindo –</span>

          <span
            className="max-w-[40vw] truncate sm:max-w-[50vw] lg:max-w-[28rem]"
            title={displayName}
          >
            {loading ? "Carregando..." : displayName}
          </span>

          <RoleBadge role={u?.role} />

          {u?.email && (
            <span
              className="text-muted-foreground max-w-[36ch] truncate inline-block align-bottom"
              title={u.email}
            >
              ({u.email})
            </span>
          )}
        </h1>

        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" asChild size="sm" className="hidden cursor-pointer sm:flex">
            <a
              href="https://www.siga.pe.gov.br/"
              target="_blank"
              rel="noopener noreferrer"
              className="dark:text-foreground"
            >
              Acessar Plataforma
            </a>
          </Button>
        </div>
      </div>
    </header>
  );
}
