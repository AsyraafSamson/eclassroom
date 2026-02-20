"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";

export function NavMain({ items }) {
  const pathname = usePathname();

  return (
    <SidebarGroup>
      <SidebarGroupLabel className="text-[0.65rem] uppercase tracking-[0.2em] text-sidebar-foreground/60">
        Navigation
      </SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton
              asChild
              isActive={
                item.url === "/dashboard"
                  ? pathname === "/dashboard"
                  : items.some(
                      (other) =>
                        other.url !== item.url &&
                        other.url.startsWith(item.url) &&
                        pathname.startsWith(other.url)
                    )
                    ? false
                    : pathname.startsWith(item.url)
              }
              tooltip={item.title}
            >
              <Link href={item.url}>
                {item.icon && <item.icon />}
                <span>{item.title}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
