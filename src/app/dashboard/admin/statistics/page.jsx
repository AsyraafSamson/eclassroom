"use client";

import { useState, useEffect, useCallback } from "react";
import {
  BarChart3, Users, School, BookOpen, Download, Printer,
  FileDown, ChevronLeft, ChevronRight, CalendarDays,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// --- Helpers ---
function getMonthRange(year, month) {
  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const d = new Date(year, month, 0); // last day of month
  const end = `${year}-${String(month).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  return { start, end };
}

function getQuarterRange(year, quarter) {
  const qStart = [1, 4, 7, 10];
  const startMonth = qStart[quarter - 1];
  const endMonth = startMonth + 2;
  const start = `${year}-${String(startMonth).padStart(2, "0")}-01`;
  const d = new Date(year, endMonth, 0);
  const end = `${year}-${String(endMonth).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  return { start, end };
}

function getYearRange(year) {
  return { start: `${year}-01-01`, end: `${year}-12-31` };
}

// --- Components ---
function StatCard({ title, value, description, icon: Icon, className: textClass }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardDescription>{title}</CardDescription>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </CardHeader>
      <CardContent>
        <div className={`text-3xl font-bold ${textClass || ""}`}>{value}</div>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </CardContent>
    </Card>
  );
}

function BarSimple({ data, labelKey, valueKey }) {
  if (!data || data.length === 0) {
    return <p className="py-4 text-center text-sm text-muted-foreground">No data yet</p>;
  }
  const peak = Math.max(...data.map((d) => d[valueKey]), 1);
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

// --- Main Page ---
export default function StatisticsPage() {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const [stats, setStats] = useState(null);
  const [printStats, setPrintStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filter state
  const [filterType, setFilterType] = useState("month");
  const [filterYear, setFilterYear] = useState(String(currentYear));
  const [filterMonth, setFilterMonth] = useState(String(currentMonth));
  const [filterQuarter, setFilterQuarter] = useState("1");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  // Bookings pagination
  const [bookingsPage, setBookingsPage] = useState(1);

  function getDateRange() {
    const y = parseInt(filterYear, 10);
    switch (filterType) {
      case "month":
        return getMonthRange(y, parseInt(filterMonth, 10));
      case "quarter":
        return getQuarterRange(y, parseInt(filterQuarter, 10));
      case "year":
        return getYearRange(y);
      case "custom":
        return { start: customStart, end: customEnd };
      default:
        return getMonthRange(y, parseInt(filterMonth, 10));
    }
  }

  const fetchStats = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const { start, end } = getDateRange();
      const params = new URLSearchParams({ page: String(page) });
      if (start && end) {
        params.set("startDate", start);
        params.set("endDate", end);
      }

      const res = await fetch(`/api/stats?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setStats(data.stats || null);
      setBookingsPage(page);
    } catch {
      toast.error("Failed to load statistics");
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterType, filterYear, filterMonth, filterQuarter, customStart, customEnd]);

  useEffect(() => {
    fetchStats(1);
  }, [fetchStats]);

  function handleExportCsv() {
    const { start, end } = getDateRange();
    const params = new URLSearchParams();
    if (start && end) {
      params.set("startDate", start);
      params.set("endDate", end);
    }
    window.open(`/api/stats/export?${params}`, "_blank");
  }

  async function handlePrint() {
    try {
      // Fetch all data for printing (including all bookings)
      const { start, end } = getDateRange();
      const params = new URLSearchParams({ all: "true" });
      if (start && end) {
        params.set("startDate", start);
        params.set("endDate", end);
      }

      const res = await fetch(`/api/stats?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setPrintStats(data.stats);
      
      // Wait for state to update and DOM to render, then print
      setTimeout(() => {
        window.print();
        // Clear print stats after printing
        setTimeout(() => setPrintStats(null), 100);
      }, 100);
    } catch (error) {
      toast.error("Failed to load data for printing");
    }
  }

  // Date range label for display
  function getFilterLabel() {
    const months = [
      "", "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December",
    ];
    switch (filterType) {
      case "month":
        return `${months[parseInt(filterMonth, 10)]} ${filterYear}`;
      case "quarter":
        return `Q${filterQuarter} ${filterYear}`;
      case "year":
        return filterYear;
      case "custom":
        return customStart && customEnd ? `${customStart} — ${customEnd}` : "Custom Range";
      default:
        return "";
    }
  }

  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  if (loading && !stats) {
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

  const approved = stats.statusBreakdown?.find((s) => s.status === "approved")?.count || 0;
  const pending = stats.statusBreakdown?.find((s) => s.status === "pending")?.count || 0;
  const rejected = stats.statusBreakdown?.find((s) => s.status === "rejected")?.count || 0;
  const bp = stats.bookingsPagination || { page: 1, total: 0, totalPages: 1 };
  const fs = stats.filteredSummary;

  return (
    <>
      <style jsx global>{`
        @media print {
          /* Reset everything */
          html, body {
            background: white !important;
            color: black !important;
            font-size: 11px !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body * { visibility: hidden; }

          /* Show only the report */
          #print-report, #print-report * { visibility: visible; }
          #print-report {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 0;
            margin: 0;
          }

          /* Hide interactive elements */
          .no-print { display: none !important; }

          /* Clean card styling for print */
          #print-report [data-slot="card"],
          #print-report .rounded-lg.border {
            border: 1px solid #ddd !important;
            border-radius: 4px !important;
            box-shadow: none !important;
            background: white !important;
            break-inside: avoid;
            margin-bottom: 12px;
          }

          /* Summary grid: force 3 columns */
          #print-report .grid.md\\:grid-cols-3 {
            display: grid !important;
            grid-template-columns: repeat(3, 1fr) !important;
            gap: 8px !important;
          }

          /* Period summary: 4 columns */
          #print-report .grid.lg\\:grid-cols-4 {
            display: grid !important;
            grid-template-columns: repeat(4, 1fr) !important;
          }

          /* Charts grid: 2 columns */
          #print-report .grid.lg\\:grid-cols-2 {
            display: grid !important;
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 8px !important;
          }
          #print-report .lg\\:col-span-2 {
            grid-column: span 2 !important;
          }

          /* Table styling */
          #print-report table {
            width: 100% !important;
            border-collapse: collapse !important;
            font-size: 10px !important;
          }
          #print-report th {
            background: #f5f5f5 !important;
            font-weight: 600 !important;
            text-align: left !important;
            padding: 6px 8px !important;
            border-bottom: 2px solid #ccc !important;
          }
          #print-report td {
            padding: 5px 8px !important;
            border-bottom: 1px solid #eee !important;
          }

          /* Badge styling for print */
          #print-report [data-slot="badge"] {
            border: 1px solid #ccc !important;
            background: #f9f9f9 !important;
            color: black !important;
            padding: 1px 6px !important;
            border-radius: 3px !important;
            font-size: 9px !important;
          }

          /* Bar chart print-friendly */
          #print-report .bg-primary\\/20 {
            background: #e0e7ff !important;
            border: 1px solid #c7d2fe !important;
          }
          #print-report .text-primary {
            color: #3730a3 !important;
          }

          /* Force black text */
          #print-report .text-muted-foreground {
            color: #666 !important;
          }
          #print-report .text-3xl,
          #print-report .text-2xl {
            color: black !important;
          }

          /* Status colors for print */
          #print-report .text-emerald-600 { color: #059669 !important; }
          #print-report .text-amber-600 { color: #d97706 !important; }
          #print-report .text-rose-600 { color: #e11d48 !important; }

          /* Print header - style the hidden print:block div */
          #print-report > div:first-child {
            display: block !important;
            text-align: center;
            padding: 16px 0;
            margin-bottom: 20px;
            border-bottom: 2px solid #333;
          }
          #print-report > div:first-child h1 {
            font-size: 20px !important;
            font-weight: 700 !important;
            color: black !important;
            margin: 0 0 8px 0 !important;
          }
          #print-report > div:first-child p {
            font-size: 11px !important;
            color: #555 !important;
            margin: 4px 0 !important;
          }

          /* Card headers */
          #print-report [data-slot="card-header"] {
            padding: 8px 12px !important;
            border-bottom: 1px solid #ddd !important;
          }
          #print-report [data-slot="card-title"] {
            font-size: 12px !important;
            font-weight: 600 !important;
            color: black !important;
          }
          #print-report [data-slot="card-description"] {
            font-size: 10px !important;
            color: #666 !important;
            margin-top: 2px !important;
          }
          #print-report [data-slot="card-content"] {
            padding: 12px !important;
          }

          /* Spacing */
          #print-report .space-y-6 > * + * {
            margin-top: 16px !important;
          }

          /* Page break before booking details for cleaner layout */
          #print-report > .space-y-6 > *:last-child {
            break-before: page;
          }
        }
      `}</style>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 no-print">
          <div className="space-y-1">
            <h2 className="text-2xl font-semibold font-[var(--font-display)]">Statistics</h2>
            <p className="text-sm text-muted-foreground">
              Analyze usage patterns and booking demand across campus
            </p>
          </div>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <FileDown className="mr-2 h-4 w-4" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleExportCsv}>
                  <Download className="mr-2 h-4 w-4" />
                  Download CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handlePrint}>
                  <Printer className="mr-2 h-4 w-4" />
                  Print / PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Filters */}
        <Card className="no-print">
          <CardContent className="pt-6">
            <div className="flex flex-wrap items-end gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Filter By</Label>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent position="popper">
                    <SelectItem value="month">Month</SelectItem>
                    <SelectItem value="quarter">Quarter</SelectItem>
                    <SelectItem value="year">Year</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {(filterType === "month" || filterType === "quarter" || filterType === "year") && (
                <div className="space-y-1">
                  <Label className="text-xs">Year</Label>
                  <Select value={filterYear} onValueChange={setFilterYear}>
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent position="popper">
                      {years.map((y) => (
                        <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {filterType === "month" && (
                <div className="space-y-1">
                  <Label className="text-xs">Month</Label>
                  <Select value={filterMonth} onValueChange={setFilterMonth}>
                    <SelectTrigger className="w-36">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent position="popper" className="max-h-60 overflow-y-auto">
                      {["January","February","March","April","May","June",
                        "July","August","September","October","November","December",
                      ].map((m, i) => (
                        <SelectItem key={i + 1} value={String(i + 1)}>{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {filterType === "quarter" && (
                <div className="space-y-1">
                  <Label className="text-xs">Quarter</Label>
                  <Select value={filterQuarter} onValueChange={setFilterQuarter}>
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent position="popper">
                      <SelectItem value="1">Q1</SelectItem>
                      <SelectItem value="2">Q2</SelectItem>
                      <SelectItem value="3">Q3</SelectItem>
                      <SelectItem value="4">Q4</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {filterType === "custom" && (
                <>
                  <div className="space-y-1">
                    <Label className="text-xs">Start Date</Label>
                    <Input
                      type="date"
                      value={customStart}
                      onChange={(e) => setCustomStart(e.target.value)}
                      className="w-40"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">End Date</Label>
                    <Input
                      type="date"
                      value={customEnd}
                      onChange={(e) => setCustomEnd(e.target.value)}
                      className="w-40"
                    />
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Printable report area */}
        <div id="print-report" className="space-y-6">
          {/* Print-only header */}
          <div className="hidden print:block mb-4">
            <h1 className="text-xl font-bold">Booking Statistics Report</h1>
            <p className="text-sm text-muted-foreground">Period: {getFilterLabel()}</p>
            <p className="text-sm text-muted-foreground">Generated: {new Date().toLocaleDateString()}</p>
          </div>

          {/* All-time summary cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <StatCard title="Total Bookings" value={stats.totalBookings} description="All time" icon={BookOpen} />
            <StatCard title="Total Users" value={stats.totalUsers} description="Registered accounts" icon={Users} />
            <StatCard title="Total Classrooms" value={stats.totalClassrooms} description="Managed rooms" icon={School} />
          </div>

          {/* Filtered period summary */}
          {fs && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <CalendarDays className="h-4 w-4" />
                  Period Summary — {getFilterLabel()}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Bookings</p>
                    <p className="text-2xl font-bold">{fs.totalBookings}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Rooms Booked</p>
                    <p className="text-2xl font-bold">{fs.totalRooms}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Days With Bookings</p>
                    <p className="text-2xl font-bold">{fs.totalDays}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Avg / Day</p>
                    <p className="text-2xl font-bold">
                      {fs.totalDays > 0 ? (fs.totalBookings / fs.totalDays).toFixed(1) : "0"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Status breakdown */}
          <div className="grid gap-4 md:grid-cols-3">
            <StatCard title="Approved" value={approved} className="text-emerald-600" />
            <StatCard title="Pending" value={pending} className="text-amber-600" />
            <StatCard title="Rejected" value={rejected} className="text-rose-600" />
          </div>

          {/* Charts + tables */}
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
                <CardDescription>Top 10 — {getFilterLabel()}</CardDescription>
              </CardHeader>
              <CardContent>
                {stats.topRooms.length === 0 ? (
                  <p className="py-4 text-center text-sm text-muted-foreground">No bookings in this period</p>
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
                <CardDescription>Top 10 — {getFilterLabel()}</CardDescription>
              </CardHeader>
              <CardContent>
                {stats.topUsers.length === 0 ? (
                  <p className="py-4 text-center text-sm text-muted-foreground">No bookings in this period</p>
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

          {/* Detailed Bookings Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Booking Details</CardTitle>
              <CardDescription>
                {getFilterLabel()} — {bp.total} booking(s)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stats.bookings?.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">No bookings in this period</p>
              ) : (
                <>
                  <div className="rounded-lg border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Time Slot</TableHead>
                          <TableHead>Start</TableHead>
                          <TableHead>End</TableHead>
                          <TableHead>Room</TableHead>
                          <TableHead>Teacher</TableHead>
                          <TableHead>Purpose</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Booked By</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(printStats?.bookings || stats.bookings)?.map((b, i) => (
                          <TableRow key={i}>
                            <TableCell className="whitespace-nowrap">{b.booking_date}</TableCell>
                            <TableCell>{b.time_slot}</TableCell>
                            <TableCell>{b.start_time}</TableCell>
                            <TableCell>{b.end_time}</TableCell>
                            <TableCell className="font-medium">{b.room_name}</TableCell>
                            <TableCell>{b.teacher_name || "—"}</TableCell>
                            <TableCell className="max-w-[200px] truncate">{b.purpose || "—"}</TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  b.status === "approved"
                                    ? "default"
                                    : b.status === "pending"
                                    ? "secondary"
                                    : "destructive"
                                }
                                className="capitalize"
                              >
                                {b.status}
                              </Badge>
                            </TableCell>
                            <TableCell>{b.booked_by || "—"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {bp.totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4 no-print">
                      <p className="text-sm text-muted-foreground">
                        Page {bp.page} of {bp.totalPages} ({bp.total} bookings)
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={bp.page <= 1}
                          onClick={() => fetchStats(bp.page - 1)}
                        >
                          <ChevronLeft className="mr-1 h-4 w-4" />
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={bp.page >= bp.totalPages}
                          onClick={() => fetchStats(bp.page + 1)}
                        >
                          Next
                          <ChevronRight className="ml-1 h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
