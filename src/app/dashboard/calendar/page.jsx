"use client";

import { useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const roomGroups = ["All Groups", "Academic", "Auditorium", "Skills Lab", "Admin", "Resource"];


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

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [group, setGroup] = useState("All Groups");

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
              {roomGroups.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
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

                return (
                  <div
                    key={`${key}-${index}`}
                    className={`min-h-[90px] rounded-sm border p-2 text-xs ${
                      cell.isCurrentMonth
                        ? "bg-background"
                        : "bg-muted/20 text-muted-foreground"
                    } ${isToday ? "bg-foreground/5" : ""}`}
                  >
                    <div className="text-right text-[0.7rem] font-semibold">
                      <span className={isToday ? "text-foreground" : ""}>
                        {cell.day}
                      </span>
                    </div>
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
