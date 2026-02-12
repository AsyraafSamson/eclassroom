import Link from "next/link";
import { getUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function UserDashboardPage() {
  const user = await getUser();

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Student Workspace
        </p>
        <h2 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl font-[var(--font-display)]">
          Hello, {user?.name || user?.email}
        </h2>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Review available classrooms and plan your next booking quickly.
        </p>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Your Access
              <Badge variant="secondary">User</Badge>
            </CardTitle>
            <CardDescription>
              Browse rooms and check schedules before you request a booking.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>Search for suitable rooms by capacity and location.</li>
              <li>Check availability before submitting a request.</li>
              <li>Track upcoming bookings in one place.</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Start with the essentials.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Button asChild>
              <Link href="/dashboard/classrooms">Browse classrooms</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/dashboard/calendar">View calendar</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
