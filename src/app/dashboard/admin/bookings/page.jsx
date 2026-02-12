"use client";

import { useState, useEffect, useCallback } from "react";
import { BookOpen, ChevronLeft, ChevronRight, Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

export default function AllBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 1 });
  const [statusFilter, setStatusFilter] = useState("all");
  const [exporting, setExporting] = useState(false);

  const fetchBookings = useCallback(async (page = 1) => {
    try {
      const params = new URLSearchParams({ page: String(page) });
      if (statusFilter !== "all") params.set("status", statusFilter);

      const res = await fetch(`/api/bookings/all?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setBookings(data.bookings || []);
      setPagination(data.pagination || { page: 1, total: 0, totalPages: 1 });
    } catch (error) {
      toast.error(error?.message || "Failed to load bookings");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { setLoading(true); fetchBookings(1); }, [fetchBookings]);

  async function handleExportCSV() {
    setExporting(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      params.set("export", "true");

      const res = await fetch(`/api/bookings/all?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const allBookings = data.bookings || [];
      
      // Create CSV content
      const headers = [
        "ID", "Status", "Classroom", "Room Group", "Teacher Name",
        "Date", "Time Slot", "Session", "User Email", "User Name",
        "Created At", "Updated At"
      ];
      
      const rows = allBookings.map(b => [
        b.id,
        b.status,
        b.classroom_name || "",
        b.group_name || "",
        b.teacher_name || "",
        b.slot_date || "",
        b.time_slot_label || "",
        b.session_name || "",
        b.user_email || "",
        b.user_name || "",
        b.created_at || "",
        b.updated_at || ""
      ]);

      const csvContent = [
        headers.join(","),
        ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      ].join("\n");

      // Download CSV
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.href = url;
      link.download = `bookings_${statusFilter}_${new Date().toISOString().split("T")[0]}.csv`;
      link.click();
      URL.revokeObjectURL(url);

      toast.success("CSV exported successfully");
    } catch (error) {
      toast.error(error?.message || "Failed to export CSV");
    } finally {
      setExporting(false);
    }
  }

  if (loading && bookings.length === 0) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-7 w-40" />
        <div className="rounded-lg border"><div className="space-y-2 p-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
        </div></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-semibold font-[var(--font-display)]">All Bookings</h2>
            <Badge variant="secondary">{pagination.total}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">Review all campus bookings</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="All Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={handleExportCSV} variant="outline" disabled={exporting || bookings.length === 0}>
          <Download className="mr-2 h-4 w-4" />
          {exporting ? "Exporting..." : "Export CSV"}
        </Button>
      </div>

      {bookings.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border py-12 text-center">
          <BookOpen className="h-8 w-8 text-muted-foreground" />
          <p className="font-medium">No bookings found</p>
        </div>
      ) : (
        <>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Classroom</TableHead>
                  <TableHead>Booked By</TableHead>
                  <TableHead>Purpose</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell className="font-medium">{b.booking_date}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {b.start_time} - {b.end_time}
                    </TableCell>
                    <TableCell>{b.classroom_name}</TableCell>
                    <TableCell>{b.user_name || b.user_email || "—"}</TableCell>
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
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Page {pagination.page} of {pagination.totalPages} ({pagination.total} bookings)
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={pagination.page <= 1} onClick={() => fetchBookings(pagination.page - 1)}>
                  <ChevronLeft className="mr-1 h-4 w-4" />Previous
                </Button>
                <Button variant="outline" size="sm" disabled={pagination.page >= pagination.totalPages} onClick={() => fetchBookings(pagination.page + 1)}>
                  Next<ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
