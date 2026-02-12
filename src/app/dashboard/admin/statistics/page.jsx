"use client";

import { useState, useEffect } from "react";
import { BarChart3, Users, School, CalendarDays, BookOpen } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

function StatCard({ title, value, description, icon: Icon }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardDescription>{title}</CardDescription>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

function BarSimple({ data, labelKey, valueKey, maxValue }) {
  if (!data || data.length === 0) {
    return <p className="py-4 text-center text-sm text-muted-foreground">No data yet</p>;
  }

  const peak = maxValue || Math.max(...data.map((d) => d[valueKey]), 1);

  return (
    <div className="space-y-2">
      {data.map((item, i) => (
        <div key={i} className="flex items-center gap-3">
          <span className="w-28 truncate text-sm text-muted-foreground">
            {item[labelKey]}
          </span>
          <div className="flex-1">
            <div
              className="h-6 rounded bg-primary/20 transition-all"
              style={{ width: `${Math.max((item[valueKey] / peak) * 100, 4)}%` }}
            >
              <span className="flex h-full items-center px-2 text-xs font-medium text-primary">
                {item[valueKey]}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function StatisticsPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then((data) => setStats(data.stats || null))
      .catch(() => toast.error("Failed to load statistics"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-7 w-40" />
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <BarChart3 className="h-10 w-10 text-muted-foreground" />
        <p className="font-medium">Unable to load statistics</p>
      </div>
    );
  }

  const approved = stats.statusBreakdown.find((s) => s.status === "approved")?.count || 0;
  const pending = stats.statusBreakdown.find((s) => s.status === "pending")?.count || 0;
  const rejected = stats.statusBreakdown.find((s) => s.status === "rejected")?.count || 0;

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-2xl font-semibold font-[var(--font-display)]">Statistics</h2>
        <p className="text-sm text-muted-foreground">
          Analyze usage patterns and booking demand across campus
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Total Bookings"
          value={stats.totalBookings}
          description="All time"
          icon={BookOpen}
        />
        <StatCard
          title="Total Users"
          value={stats.totalUsers}
          description="Registered accounts"
          icon={Users}
        />
        <StatCard
          title="Total Classrooms"
          value={stats.totalClassrooms}
          description="Managed rooms"
          icon={School}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Approved</CardDescription>
            <CardTitle className="text-2xl text-emerald-600">{approved}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pending</CardDescription>
            <CardTitle className="text-2xl text-amber-600">{pending}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Rejected</CardDescription>
            <CardTitle className="text-2xl text-rose-600">{rejected}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Monthly Bookings</CardTitle>
            <CardDescription>Last 12 months</CardDescription>
          </CardHeader>
          <CardContent>
            <BarSimple data={stats.monthlyBookings} labelKey="month" valueKey="count" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Most Booked Rooms</CardTitle>
            <CardDescription>Top 10 classrooms</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.topRooms.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">No bookings yet</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Classroom</TableHead>
                    <TableHead className="text-right">Bookings</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.topRooms.map((room, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{room.name}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="secondary">{room.booking_count}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Most Active Users</CardTitle>
            <CardDescription>Top 10 by booking count</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.topUsers.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">No bookings yet</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="text-right">Bookings</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.topUsers.map((u, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{u.full_name || "—"}</TableCell>
                      <TableCell className="text-muted-foreground">{u.email}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="secondary">{u.booking_count}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
