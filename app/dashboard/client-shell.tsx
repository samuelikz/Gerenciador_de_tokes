"use client";

import { type ReactNode } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";

export function ClientShell({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      {children}
    </SidebarProvider>
  );
}
