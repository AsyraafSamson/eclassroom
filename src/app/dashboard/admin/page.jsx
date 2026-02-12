import Link from "next/link";
import {
  BarChart3,
  BookOpen,
  Building2,
  Calendar,
  CalendarClock,
  CalendarDays,
  CircleUser,
  Clock3,
  Laptop2,
  School,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const managementItems = [
  {
    title: "School Details",
    description: "Update campus profile and contact information.",
    icon: School,
    href: "/dashboard/admin/school",
  },
  {
    title: "Rooms",
    description: "Manage classrooms, labs, and shared spaces.",
    icon: Building2,
    href: "/dashboard/classrooms",
  },
  {
    title: "Departments",
    description: "Organize departments and teaching units.",
    icon: Users,
    href: "/dashboard/admin/departments",
  },
  {
    title: "Equipment",
    description: "Track room equipment and inventory needs.",
    icon: Laptop2,
    href: "/dashboard/admin/equipment",
  },
  {
    title: "Users",
    description: "Manage administrator and staff accounts.",
    icon: CircleUser,
    href: "/dashboard/admin/users",
  },
];

const schedulingItems = [
  {
    title: "Calendar",
    description: "Review bookings across the month at a glance.",
    icon: CalendarDays,
    href: "/dashboard/calendar",
  },
  {
    title: "Schedules",
    description: "Maintain booking time slots and rules.",
    icon: Clock3,
    href: "/dashboard/admin/schedules",
  },
  {
    title: "Timetable Weeks",
    description: "Configure weekly academic timetables.",
    icon: CalendarClock,
    href: "/dashboard/admin/weeks",
  },
  {
    title: "Sessions",
    description: "Plan academic sessions and terms.",
    icon: Calendar,
    href: "/dashboard/admin/sessions",
  },
  {
    title: "Holidays",
    description: "Add public holidays and special closures.",
    icon: Calendar,
    href: "/dashboard/admin/holidays",
  },
  {
    title: "All Bookings",
    description: "Review confirmed bookings across campus.",
    icon: BookOpen,
    href: "/dashboard/admin/bookings",
  },
];

const insightItems = [
  {
    title: "Statistics",
    description: "Analyze usage and demand trends.",
    icon: BarChart3,
    href: "/dashboard/admin/statistics",
  },
];

function AdminCard({ item, isLive }) {
  const Icon = item.icon;

  return (
    <Card className="group flex h-full flex-col justify-between transition-shadow hover:shadow-md">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
            <Icon className="h-5 w-5 text-foreground" />
          </div>
          {!isLive && (
            <Badge variant="secondary" className="uppercase tracking-[0.2em] text-[0.55rem]">
              Coming Soon
            </Badge>
          )}
        </div>
        <CardTitle className="font-[var(--font-display)] text-lg">
          {item.title}
        </CardTitle>
        <CardDescription>{item.description}</CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        Keep this area updated so bookings stay reliable and consistent.
      </CardContent>
      <CardFooter>
        {isLive ? (
          <Button asChild className="w-full">
            <Link href={item.href}>Open</Link>
          </Button>
        ) : (
          <Button className="w-full" variant="outline" disabled>
            Coming soon
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Admin Settings
        </p>
        <h2 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl font-[var(--font-display)]">
          Campus operations control
        </h2>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Centralize schedules, staffing, and room availability in one place.
        </p>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Management</h3>
          <Badge variant="secondary">Core</Badge>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {managementItems.map((item) => (
            <AdminCard
              key={item.title}
              item={item}
              isLive
            />
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Scheduling</h3>
          <Badge variant="secondary">Calendar</Badge>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {schedulingItems.map((item) => (
            <AdminCard
              key={item.title}
              item={item}
              isLive
            />
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Insights</h3>
          <Badge variant="secondary">Reports</Badge>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {insightItems.map((item) => (
            <AdminCard key={item.title} item={item} isLive />
          ))}
        </div>
      </section>
    </div>
  );
}
