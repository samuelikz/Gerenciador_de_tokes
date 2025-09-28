// components/app-sidebar.tsx
"use client";

import * as React from "react";
import { NavDocuments } from "@/components/nav-documents";
import { NavMain } from "@/components/nav-main";
import { NavSecondary } from "@/components/nav-secondary";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

import type { Icon } from "@tabler/icons-react";
import {
  IconInnerShadowTop,
  IconLayoutDashboard,
  IconListDetails,
  IconUsers,
  IconHelpCircle,
  IconFileText,
} from "@tabler/icons-react";

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  isAdmin?: boolean;
  user?: { name?: string; email?: string; avatar?: string | null };
}

type NavItem = { title: string; url: string; icon: Icon; adminOnly?: true };
type DocItem = { name: string; url: string; icon: Icon };

type UserData = {
  id: string | number;
  email?: string;
  role?: string;
  name?: string;
  avatar?: string | null;
};

type MeResponse =
  | { success: true; data: UserData }
  | { success: false; message: string };

const base = {
  navMain: [
    { title: "Dashboard", url: "/dashboard", icon: IconLayoutDashboard },
    { title: "Tokens", url: "/dashboard/tokens", icon: IconListDetails },
    { title: "Usuários", url: "/dashboard/users", icon: IconUsers, adminOnly: true as const },
  ] as NavItem[],
  navSecondary: [{ title: "Ajuda", url: "#", icon: IconHelpCircle }] as NavItem[],
  documents: [{ name: "Playground", url: "/dashboard/documentos", icon: IconFileText }] as DocItem[],
};

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL!; // ex.: http://localhost:3321

function getAuthToken(): string | null {
  try {
    return typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
  } catch {
    return null;
  }
}

export function AppSidebar({ isAdmin: isAdminProp, user: userProp, ...props }: AppSidebarProps) {
  const [me, setMe] = React.useState<UserData | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        // 1) Tenta direto na API com Bearer (se houver token no localStorage)
        const token = getAuthToken();
        if (token) {
          const res = await fetch(`${API_URL}/users/me`, {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            cache: "no-store",
            credentials: "omit",
          });

          const json = await res.json().catch(() => ({}));
          const data = json?.data ?? json;

          if (!mounted) return;

          if (res.ok && data) {
            setMe({
              id: data.id,
              email: data.email,
              role: data.role,
              name: data.name ?? (data.email ? data.email.split("@")[0] : undefined),
              avatar: data.avatar ?? null,
            });
            return; // sucesso — não precisa fallback
          }
        }

        // 2) Fallback: usa o endpoint server (/api/auth/me) que lê cookie httpOnly
        const res2 = await fetch(`/api/auth/me`, {
          credentials: "include",
          cache: "no-store",
        });
        const json2 = (await res2.json().catch(() => ({}))) as MeResponse;

        if (!mounted) return;

        if (json2 && "success" in json2 && json2.success) {
          const d = json2.data;
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
      } catch (e) {
        if (!mounted) return;
        setMe(null);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const isAdminDetected = me?.role === "ADMIN";
  const isAdmin = typeof isAdminProp === "boolean" ? isAdminProp : isAdminDetected;

  const resolvedUser = {
    name:
      userProp?.name ??
      me?.name ??
      (me?.email ? me.email.split("@")[0] : undefined) ??
      "Usuário",
    email: userProp?.email ?? me?.email ?? "—",
    avatar: userProp?.avatar ?? me?.avatar ?? "/avatars/shadcn.jpg",
  };

  const navMain = base.navMain.filter((i) => !i.adminOnly || isAdmin);

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="data-[slot=sidebar-menu-button]:!p-1.5">
              <a href="/dashboard">
                <IconInnerShadowTop className="!size-5" />
                <span className="text-base font-semibold">Siga Api Perpart.</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {/* {loading && <div className="p-3 text-sm text-muted-foreground">Carregando…</div>} */}
        <NavMain items={navMain} />
        <NavDocuments items={base.documents} />
        <NavSecondary items={base.navSecondary} className="mt-auto" />
      </SidebarContent>

      <SidebarFooter>
        <NavUser user={resolvedUser} />
      </SidebarFooter>
    </Sidebar>
  );
}
