"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { CalendarDays, School, Clock3, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function UserDashboardPage() {
  const [user, setUser] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchBookings();
  }, []);

  async function fetchBookings() {
    try {
      const [userData, bookingData] = await Promise.all([
        fetch("/api/auth/me").then((r) => r.json()),
        fetch("/api/bookings/my").then((r) => r.json()),
      ]);
      setUser(userData.user || null);
      setBookings(bookingData.bookings || []);
    } catch {
      toast.error("Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }

  async function handleCancelBooking() {
    if (!selectedBooking) return;
    setActionLoading(true);

    try {
      const res = await fetch(`/api/bookings/${selectedBooking.id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to cancel booking");
      }

      setBookings((prev) => prev.filter((b) => b.id !== selectedBooking.id));
      toast.success("Booking cancelled successfully");
      setCancelDialogOpen(false);
    } catch (error) {
      toast.error(error?.message || "Failed to cancel booking");
    } finally {
      setActionLoading(false);
    }
  }

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = bookings.filter((b) => b.booking_date >= today);
  const past = bookings.filter((b) => b.booking_date < today);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
          My Dashboard
        </p>
        <h2 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl font-[var(--font-display)]">
          Hello, {user?.name || user?.email || "User"}
        </h2>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Review your bookings and plan your next classroom reservation.
        </p>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Bookings</CardDescription>
            <CardTitle className="text-3xl">{bookings.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Upcoming</CardDescription>
            <CardTitle className="text-3xl">{upcoming.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">From today onwards</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Quick Actions</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <Button asChild size="sm">
              <Link href="/dashboard/classrooms">Book a Room</Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href="/dashboard/calendar">View Calendar</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-lg">Upcoming Bookings</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {upcoming.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <School className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No upcoming bookings</p>
              <Button asChild size="sm" variant="outline" className="mt-2">
                <Link href="/dashboard/classrooms">Make a booking</Link>
              </Button>
            </div>
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Classroom</TableHead>
                    <TableHead>Purpose</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {upcoming.slice(0, 10).map((b) => (
                    <TableRow key={b.id}>
                      <TableCell className="font-medium">{b.booking_date}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {b.start_time} - {b.end_time}
                      </TableCell>
                      <TableCell>{b.classroom_name}</TableCell>
                      <TableCell className={!b.purpose ? "text-muted-foreground" : ""}>
                        {b.purpose || "—"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            b.status === "approved" ? "default"
                            : b.status === "pending" ? "secondary"
                            : "destructive"
                          }
                          className="capitalize"
                        >
                          {b.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => {
                            setSelectedBooking(b);
                            setCancelDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {past.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Clock3 className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-lg">Past Bookings</CardTitle>
              <Badge variant="secondary">{past.length}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Classroom</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {past.slice(0, 10).map((b) => (
                    <TableRow key={b.id}>
                      <TableCell className="font-medium">{b.booking_date}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {b.start_time} - {b.end_time}
                      </TableCell>
                      <TableCell>{b.classroom_name}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="capitalize">{b.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Booking</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel your booking for{" "}
              <span className="font-semibold">{selectedBooking?.classroom_name}</span> on{" "}
              <span className="font-semibold">{selectedBooking?.booking_date}</span>?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Booking</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelBooking}
              disabled={actionLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {actionLoading ? "Cancelling..." : "Cancel Booking"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
