import Link from "next/link";
import { getUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function DashboardPage() {
  const user = await getUser();
  const isAdmin = user.role === "admin";

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Dashboard Overview
        </p>
        <h2 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl font-[var(--font-display)]">
          Welcome back, {user.name || user.email}
        </h2>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Track classroom availability, manage updates, and keep campus spaces
          ready for learning.
        </p>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Your Access
              <Badge variant="secondary" className="capitalize">
                {isAdmin ? "Administrator" : "User"}
              </Badge>
            </CardTitle>
            <CardDescription>
              {isAdmin
                ? "You can manage classroom details and status updates."
                : "You can browse classrooms and check availability."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>Maintain accurate classroom profiles and capacity.</li>
              <li>Monitor availability to keep schedules on track.</li>
              <li>Use quick actions to stay in flow.</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Jump straight to classroom management.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Button asChild>
              <Link href="/dashboard/classrooms">
                {isAdmin ? "Manage Classrooms" : "Browse Classrooms"}
              </Link>
            </Button>
            {isAdmin ? (
              <Button asChild variant="outline">
                <Link href="/dashboard/admin">Open admin settings</Link>
              </Button>
            ) : (
              <Button asChild variant="outline">
                <Link href="/dashboard/classrooms">
                  View availability overview
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
