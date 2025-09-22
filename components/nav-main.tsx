"use client"

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Icon } from "@tabler/icons-react"
import Link from "next/link"

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon?: Icon
  }[]
}) {
  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
        </SidebarMenu>
        <SidebarMenu>
  {items.map((item) => (
    <SidebarMenuItem key={item.title}>
      <SidebarMenuButton tooltip={item.title} asChild>
        <Link href={item.url} className="flex items-center gap-2">
          {item.icon && <item.icon />}
          <span className="cursor-pointer">{item.title}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  ))}
</SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
