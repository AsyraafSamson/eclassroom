"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

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

export default function CalendarPage() {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [group, setGroup] = useState("all");
  const [roomGroups, setRoomGroups] = useState([]);
  const [bookingCounts, setBookingCounts] = useState({});

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

  useEffect(() => {
    fetch("/api/room-groups")
      .then((r) => r.json())
      .then((data) => setRoomGroups(data.roomGroups || []))
      .catch(() => {});
  }, []);

  // Fetch booking counts for each visible day in the current month
  useEffect(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const counts = {};
    const fetches = [];

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const groupParam = group !== "all" ? `&groupId=${group}` : "";
      fetches.push(
        fetch(`/api/bookings?date=${dateStr}${groupParam}`)
          .then((r) => r.json())
          .then((data) => {
            counts[dateStr] = (data.bookings || []).length;
          })
          .catch(() => {
            counts[dateStr] = 0;
          })
      );
    }

    Promise.all(fetches).then(() => setBookingCounts({ ...counts }));
  }, [currentDate, group]);

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-2 border-b pb-3">
          <CalendarDays className="h-5 w-5 text-foreground" />
          <h2 className="text-lg font-semibold text-foreground">
            Booking Calendar
          </h2>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
          <span className="text-muted-foreground">Filter by Group:</span>
          <Select value={group} onValueChange={setGroup}>
            <SelectTrigger className="w-48">
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

        <div className="mt-4 flex items-center justify-between gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setCurrentDate(
                (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1)
              )
            }
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Previous Month
          </Button>
          <h3 className="text-base font-semibold text-foreground">
            {monthLabel}
          </h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setCurrentDate(
                (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1)
              )
            }
          >
            Next Month
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>

        <div className="mt-4 overflow-x-auto">
          <div className="min-w-[800px]">
            <div className="grid grid-cols-7 rounded-md bg-muted/40 text-center text-xs font-semibold uppercase text-muted-foreground">
              {weekDays.map((day) => (
                <div key={day} className="py-2">
                  {day}
                </div>
              ))}
            </div>

            <div className="mt-1 grid grid-cols-7 gap-1">
              {cells.map((cell, index) => {
                const key = `${cell.date.getFullYear()}-${cell.date.getMonth()}-${cell.date.getDate()}`;
                const isToday = key === todayKey && cell.isCurrentMonth;
                const dateStr = cell.isCurrentMonth ? dateToString(cell.date) : null;
                const count = dateStr ? bookingCounts[dateStr] || 0 : 0;

                const handleClick = () => {
                  if (cell.isCurrentMonth) {
                    router.push(`/dashboard/classrooms?date=${dateStr}`);
                  }
                };

                return (
                  <div
                    key={`${key}-${index}`}
                    onClick={handleClick}
                    className={`min-h-[90px] rounded-sm border p-2 text-xs ${
                      cell.isCurrentMonth
                        ? "bg-background cursor-pointer hover:bg-accent/50 transition-colors"
                        : "bg-muted/20 text-muted-foreground"
                    } ${isToday ? "bg-foreground/5" : ""}`}
                  >
                    <div className="text-right text-[0.7rem] font-semibold">
                      <span className={isToday ? "text-foreground" : ""}>
                        {cell.day}
                      </span>
                    </div>
                    {cell.isCurrentMonth && count > 0 && (
                      <div className="mt-1 rounded bg-primary/10 px-1.5 py-0.5 text-center text-[0.65rem] font-medium text-primary">
                        {count} booking{count !== 1 ? "s" : ""}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
