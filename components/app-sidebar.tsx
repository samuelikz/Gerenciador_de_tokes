// components/app-sidebar.tsx
"use client"

import * as React from "react"
import { NavDocuments } from "@/components/nav-documents"
import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

// importe o tipo Icon e use ícones reais
import type { Icon } from "@tabler/icons-react"
import {
  IconInnerShadowTop,
  IconLayoutDashboard,
  IconListDetails,
  IconUsers,
  IconHelpCircle,
  IconFileText,
} from "@tabler/icons-react"

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  isAdmin?: boolean
  user?: { name?: string; email?: string; avatar?: string | null }
}

// Tipos com icon obrigatório
type NavItem = { title: string; url: string; icon: Icon; adminOnly?: true }
type DocItem = { name: string; url: string; icon: Icon }

const base = {
  navMain: [
    { title: "Dashboard", url: "/dashboard", icon: IconLayoutDashboard },
    { title: "Tokens", url: "/dashboard/tokens", icon: IconListDetails },
    { title: "Usuários", url: "/dashboard/users", icon: IconUsers, adminOnly: true as const },
  ] as NavItem[],

  navSecondary: [
    { title: "Ajuda", url: "#", icon: IconHelpCircle },
  ] as NavItem[],

  documents: [
    // 👇 novo item “Documentos” levando para a página estática
    { name: "Playground", url: "/dashboard/documentos", icon: IconFileText },
    // você pode manter outros links estáticos aqui também
    // { name: "Documentação API", url: "#", icon: IconFileText },
  ] as DocItem[],
}

export function AppSidebar({ isAdmin = false, user, ...props }: AppSidebarProps) {
  const navMain = base.navMain.filter((i) => !i.adminOnly || isAdmin)

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
        <NavMain items={navMain} />
        <NavDocuments items={base.documents} />
        <NavSecondary items={base.navSecondary} className="mt-auto" />
      </SidebarContent>

      <SidebarFooter>
        <NavUser
          user={{
            name: user?.name ?? "Usuário",
            email: user?.email ?? "—",
            avatar: user?.avatar ?? "/avatars/shadcn.jpg",
          }}
        />
      </SidebarFooter>
    </Sidebar>
  )
}
