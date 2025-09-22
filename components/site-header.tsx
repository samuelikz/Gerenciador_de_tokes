// components/site-header.tsx
"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"

type MiniUser = { name?: string; email?: string; role?: string }
interface SiteHeaderProps extends React.ComponentProps<"header"> {
  user?: MiniUser | null
}

export function SiteHeader({ user, className, ...props }: SiteHeaderProps) {
  const displayName = user?.name ?? user?.email ?? "Usuário"

  return (
    <header
      className={`flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height) ${className ?? ""}`}
      {...props}
    >
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mx-2 data-[orientation=vertical]:h-4" />
        <h1 className="text-base font-medium flex items-center gap-2">
          <span>Bem-vindo –</span>
          <span
            className="max-w-[55vw] truncate sm:max-w-[40vw] lg:max-w-[28rem]"
            title={displayName}
          >
            {displayName}
          </span>
          {user?.role && (
            <span className="text-muted-foreground hidden sm:inline">({user.email})</span>
          )}
        </h1>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" asChild size="sm" className="hidden sm:flex cursor-pointer">
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
  )
}
