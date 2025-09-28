// components/site-header.tsx
"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { fetchMe, type MeData, type MeResponse } from "@/lib/me";

type MiniUser = { name?: string; email?: string; role?: string };

interface SiteHeaderProps extends React.ComponentProps<"header"> {
  /** Se vier do pai (SSR), não faz fetch. */
  user?: MiniUser | null;
}

function RoleBadge({ role }: { role?: string }) {
  if (!role) return null;
  return (
    <span className="rounded-full border px-2 py-0.5 text-[10px] font-medium leading-none text-muted-foreground">
      {role}
    </span>
  );
}

export function SiteHeader({ user: userProp, className, ...props }: SiteHeaderProps) {
  const [me, setMe] = React.useState<MeData | null>(null);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    if (userProp) {
      setMe({
        id: "from-props",
        email: userProp.email ?? "",
        name: userProp.name ?? (userProp.email ? userProp.email.split("@")[0] : undefined),
        role: userProp.role,
        avatar: null,
      });
      setLoading(false);
      return;
    }
    setLoading(true);
    const resp: MeResponse = await fetchMe().catch(() => ({ success: false, message: "Erro" } as const));
    setMe(resp.success ? resp.data : null);
    setLoading(false);
  }, [userProp]);

  React.useEffect(() => {
    (async () => { await load(); })();
    const onFocus = () => load();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [load]);

  const u = me;
  const displayName = u?.name ?? (u?.email ? u.email.split("@")?.[0] : "Usuário");

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

          {/* Nome (ou fallback) */}
          <span
            className="max-w-[40vw] truncate sm:max-w-[50vw] lg:max-w-[28rem]"
            title={displayName}
          >
            {loading ? "Carregando..." : displayName}
          </span>

          {/* Role como badge */}
          <RoleBadge role={u?.role} />

          {/* E-mail SEM esconder por breakpoint, com truncamento */}
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
