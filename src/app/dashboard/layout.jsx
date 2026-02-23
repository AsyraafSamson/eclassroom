import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { getDB } from "@/lib/db";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";

export default async function DashboardLayout({ children }) {
  const user = await getUser();

  if (!user) {
    redirect("/login");
  }

  let schoolInfo = null;
  try {
    const db = await getDB();
    schoolInfo = await db.prepare("SELECT * FROM school_info WHERE id = 1").first();
  } catch {}

  const siteTitle = schoolInfo?.site_title || "eClassroom";

  return (
    <SidebarProvider>
      <AppSidebar user={user} siteTitle={siteTitle} />
      <SidebarInset className="bg-background [background-image:radial-gradient(1200px_circle_at_0%_-20%,rgba(15,23,42,0.08),transparent_55%)] min-w-0">
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between gap-2 border-b bg-background/80 px-4 backdrop-blur">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <span className="text-sm font-medium text-foreground">Workspace</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Badge variant="secondary" className="capitalize">
              {user.role === "admin" ? "Administrator" : "User"}
            </Badge>
          </div>
        </header>
        <div className="flex-1 min-w-0 p-4 md:p-6 lg:p-8">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
