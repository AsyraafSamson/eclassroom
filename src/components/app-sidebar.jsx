"use client";

import { LayoutDashboard, Settings, School } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarRail,
} from "@/components/ui/sidebar";
import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";

const adminNav = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Classrooms",
    url: "/dashboard/classrooms",
    icon: School,
  },
  {
    title: "Settings",
    url: "/dashboard/admin",
    icon: Settings,
  },
];

const userNav = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "My Dashboard",
    url: "/dashboard/user",
    icon: LayoutDashboard,
  },
  {
    title: "Classrooms",
    url: "/dashboard/classrooms",
    icon: School,
  },
];

export function AppSidebar({ user, ...props }) {
  const navItems = user?.role === "admin" ? adminNav : userNav;

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="flex h-16 items-center border-b border-sidebar-border/60 px-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="/dashboard">
                <div className="bg-sidebar-primary/90 text-sidebar-primary-foreground ring-sidebar-border/60 flex aspect-square size-8 items-center justify-center rounded-lg ring-1">
                  <School className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold font-[var(--font-display)]">
                    eClassroom
                  </span>
                  <span className="truncate text-[0.65rem] uppercase tracking-[0.2em] text-sidebar-foreground/60">
                    Management System
                  </span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navItems} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
