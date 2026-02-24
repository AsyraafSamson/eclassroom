"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const weekDaysFull = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const weekDaysShort = ["S", "M", "T", "W", "T", "F", "S"];

function buildCalendar(date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();

  const cells = [];
  for (let i = 0; i < 42; i += 1) {
    const dayNumber = i - firstDayIndex + 1;
    let day = dayNumber;
    let isCurrentMonth = true;

    if (dayNumber <= 0) {
      day = prevMonthDays + dayNumber;
      isCurrentMonth = false;
    } else if (dayNumber > daysInMonth) {
      day = dayNumber - daysInMonth;
      isCurrentMonth = false;
    }

    cells.push({
      day,
      isCurrentMonth,
      date: new Date(year, month, dayNumber),
    });
  }

  return cells;
}

function dateToString(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// Returns first name only (for compact mobile display)
function firstName(fullName) {
  return fullName?.split(" ")[0] || "User";
}

export default function CalendarPage() {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [group, setGroup] = useState("all");
  const [roomGroups, setRoomGroups] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  // Store full booking arrays per date instead of just counts
  const [bookingsByDate, setBookingsByDate] = useState({});

  const monthLabel = useMemo(
    () =>
      currentDate.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      }),
    [currentDate]
  );

  const cells = useMemo(() => buildCalendar(currentDate), [currentDate]);

  const today = new Date();
  const todayKey = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;

  // Fetch current logged-in user once on mount
  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => setCurrentUser(data.user || null))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch("/api/room-groups")
      .then((r) => r.json())
      .then((data) => setRoomGroups(data.roomGroups || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const byDate = {};
    const fetches = [];

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const groupParam = group !== "all" ? `&groupId=${group}` : "";
      fetches.push(
        fetch(`/api/bookings?date=${dateStr}${groupParam}`)
          .then((r) => r.json())
          .then((data) => {
            byDate[dateStr] = data.bookings || [];
          })
          .catch(() => {
            byDate[dateStr] = [];
          })
      );
    }

    Promise.all(fetches).then(() => setBookingsByDate({ ...byDate }));
  }, [currentDate, group]);

  const isAdmin = currentUser?.role === "admin";

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Card with overflow-hidden so grid respects rounded corners */}
      <div className="rounded-lg border bg-card shadow-sm overflow-hidden">

        {/* Card header */}
        <div className="flex items-center gap-2 border-b px-4 py-3 md:px-6">
          <CalendarDays className="h-5 w-5 text-foreground shrink-0" />
          <h2 className="text-base font-semibold text-foreground md:text-lg">
            Booking Calendar
          </h2>
        </div>

        {/* Controls */}
        <div className="px-4 py-3 space-y-3 md:px-6 md:py-4">
          {/* Group filter — full width on mobile */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
            <span className="text-sm text-muted-foreground shrink-0">
              Filter by Group:
            </span>
            <Select value={group} onValueChange={setGroup}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Groups</SelectItem>
                {roomGroups.map((g) => (
                  <SelectItem key={g.id} value={String(g.id)}>
                    {g.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Month navigation — icon-only on mobile, with text on sm+ */}
          <div className="flex items-center justify-between gap-2">
            <Button
              variant="outline"
              size="sm"
              className="touch-manipulation"
              onClick={() =>
                setCurrentDate(
                  (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1)
                )
              }
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline ml-1">Previous</span>
            </Button>

            <h3 className="text-sm font-semibold text-foreground sm:text-base">
              {monthLabel}
            </h3>

            <Button
              variant="outline"
              size="sm"
              className="touch-manipulation"
              onClick={() =>
                setCurrentDate(
                  (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1)
                )
              }
            >
              <span className="hidden sm:inline mr-1">Next</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Calendar grid — edge-to-edge, no horizontal scroll */}
        <div className="border-t">
          {/* Day headers — same gap-px bg-border treatment as the cells */}
          <div className="grid grid-cols-7 gap-px bg-border text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {weekDaysFull.map((day, i) => (
              <div key={day} className="py-2 bg-muted/40">
                <span className="hidden sm:inline">{day}</span>
                <span className="sm:hidden">{weekDaysShort[i]}</span>
              </div>
            ))}
          </div>

          {/* Cells — gap-px with bg-border creates clean 1px dividers */}
          <div className="grid grid-cols-7 gap-px bg-border">
            {cells.map((cell, index) => {
              const key = `${cell.date.getFullYear()}-${cell.date.getMonth()}-${cell.date.getDate()}`;
              const isToday = key === todayKey && cell.isCurrentMonth;
              const dateStr = cell.isCurrentMonth
                ? dateToString(cell.date)
                : null;

              // All bookings for this day from the API
              const allBookings = dateStr ? bookingsByDate[dateStr] ?? [] : [];

              // Admin: one entry per unique user who booked that day
              // User: only their own bookings
              const relevantBookings = (() => {
                if (!cell.isCurrentMonth || !currentUser) return [];
                if (isAdmin) {
                  const seen = new Set();
                  return allBookings.filter((b) => {
                    if (seen.has(b.user_id)) return false;
                    seen.add(b.user_id);
                    return true;
                  });
                }
                return allBookings.filter(
                  (b) => b.user_id === currentUser.id
                );
              })();

              // Max 2 items visible in cell, rest shown as "+N more"
              const maxVisible = 2;
              const visibleItems = relevantBookings.slice(0, maxVisible);
              const extraCount = Math.max(
                0,
                relevantBookings.length - maxVisible
              );

              const handleClick = () => {
                if (cell.isCurrentMonth) {
                  router.push(`/dashboard/classrooms?date=${dateStr}`);
                }
              };

              return (
                <div
                  key={`${key}-${index}`}
                  onClick={handleClick}
                  style={{ WebkitTapHighlightColor: "transparent" }}
                  className={[
                    "flex flex-col",
                    "min-h-[52px] sm:min-h-[72px] md:min-h-[90px]",
                    "p-1 sm:p-1.5 md:p-2",
                    "touch-manipulation",
                    cell.isCurrentMonth
                      ? "bg-background cursor-pointer hover:bg-accent/50 active:bg-accent/70 transition-colors"
                      : "bg-muted/20",
                    isToday ? "bg-primary/5" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  {/* Day number — iOS-style filled circle for today */}
                  <div className="flex justify-end">
                    {isToday ? (
                      <span className="flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-[0.6rem] sm:text-[0.65rem] font-bold leading-none">
                        {cell.day}
                      </span>
                    ) : (
                      <span
                        className={[
                          "text-[0.65rem] sm:text-[0.7rem] font-medium leading-none",
                          cell.isCurrentMonth
                            ? "text-foreground"
                            : "text-muted-foreground/40",
                        ].join(" ")}
                      >
                        {cell.day}
                      </span>
                    )}
                  </div>

                  {/* Booking info */}
                  {relevantBookings.length > 0 && (
                    <div className="mt-auto pt-0.5 space-y-px">
                      {isAdmin ? (
                        // Admin: show each unique user's name
                        <>
                          {visibleItems.map((b) => (
                            <div
                              key={b.user_id}
                              className="rounded-sm bg-primary/10 px-1 py-0.5 leading-tight overflow-hidden"
                            >
                              {/* Mobile: first name only */}
                              <span className="sm:hidden block truncate text-center text-[0.55rem] font-semibold text-primary">
                                {firstName(b.user_name || b.username)}
                              </span>
                              {/* sm+: full name */}
                              <span className="hidden sm:block truncate text-center text-[0.6rem] font-medium text-primary">
                                {b.user_name || b.username || "User"}
                              </span>
                            </div>
                          ))}
                          {extraCount > 0 && (
                            <div className="text-center text-[0.5rem] sm:text-[0.55rem] text-muted-foreground leading-tight">
                              +{extraCount} more
                            </div>
                          )}
                        </>
                      ) : (
                        // Regular user: show their own booking count only
                        <div className="rounded-sm bg-primary/10 px-1 py-0.5 text-center leading-tight">
                          <span className="sm:hidden text-[0.6rem] font-semibold text-primary">
                            {relevantBookings.length}
                          </span>
                          <span className="hidden sm:inline text-[0.6rem] font-medium text-primary">
                            {relevantBookings.length} booking
                            {relevantBookings.length !== 1 ? "s" : ""}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
