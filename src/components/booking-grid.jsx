"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CalendarDays, ChevronLeft, ChevronRight, PlusCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BookingDialog } from "@/components/booking-dialog";

function getTodayString() {
  return new Date().toISOString().slice(0, 10);
}

function isWithin(date, start, end) {
  return date >= start && date <= end;
}

export function BookingGrid() {
  const searchParams = useSearchParams();
  const dateFromUrl = searchParams.get("date");
  
  const [sessions, setSessions] = useState([]);
  const [roomGroups, setRoomGroups] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [bookings, setBookings] = useState([]);

  const [selectedSessionId, setSelectedSessionId] = useState("");
  const [selectedGroupId, setSelectedGroupId] = useState("all");
  const [selectedDate, setSelectedDate] = useState(dateFromUrl || getTodayString());

  const [bookingOpen, setBookingOpen] = useState(false);
  const [selectedClassroom, setSelectedClassroom] = useState(null);
  const [selectedSlotId, setSelectedSlotId] = useState("");
  const [multiBookingMode, setMultiBookingMode] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/sessions").then((res) => res.json()),
      fetch("/api/room-groups").then((res) => res.json()),
      fetch("/api/time-slots").then((res) => res.json()),
    ])
      .then(([sessionsData, groupsData, slotsData]) => {
        const sessionList = sessionsData.sessions || [];
        setSessions(sessionList);
        setRoomGroups(groupsData.roomGroups || []);
        setTimeSlots(slotsData.timeSlots || []);

        if (sessionList.length > 0) {
          const today = getTodayString();
          const current =
            sessionList.find((session) =>
              isWithin(today, session.start_date, session.end_date)
            ) || sessionList[0];
          setSelectedSessionId(String(current.id));
          if (!isWithin(today, current.start_date, current.end_date)) {
            setSelectedDate(current.start_date);
          }
        }
      })
      .catch(() => toast.error("Failed to load booking filters"));
  }, []);

  useEffect(() => {
    if (!selectedDate) return;

    const groupParam = selectedGroupId === "all" ? "" : selectedGroupId;
    const classroomsUrl = groupParam
      ? `/api/classrooms?groupId=${groupParam}`
      : "/api/classrooms";
    const bookingsUrl = groupParam
      ? `/api/bookings?date=${selectedDate}&groupId=${groupParam}`
      : `/api/bookings?date=${selectedDate}`;

    Promise.all([
      fetch(classroomsUrl).then((res) => res.json()),
      fetch(bookingsUrl).then((res) => res.json()),
    ])
      .then(([classroomData, bookingData]) => {
        setClassrooms(classroomData.classrooms || []);
        setBookings(bookingData.bookings || []);
      })
      .catch(() => toast.error("Failed to load booking grid"));
  }, [selectedDate, selectedGroupId]);

  useEffect(() => {
    if (!selectedSessionId || sessions.length === 0) return;

    const session = sessions.find(
      (item) => String(item.id) === String(selectedSessionId)
    );
    if (!session) return;

    if (!isWithin(selectedDate, session.start_date, session.end_date)) {
      setSelectedDate(session.start_date);
    }
  }, [selectedSessionId, sessions, selectedDate]);

  const bookingMap = useMemo(() => {
    const map = new Map();
    bookings.forEach((booking) => {
      map.set(`${booking.classroom_id}-${booking.time_slot_id}`, booking);
    });
    return map;
  }, [bookings]);

  function handlePrevDay() {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() - 1);
    setSelectedDate(date.toISOString().slice(0, 10));
  }

  function handleNextDay() {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + 1);
    setSelectedDate(date.toISOString().slice(0, 10));
  }

  function handleOpenBooking(classroom, slot) {
    setSelectedClassroom(classroom);
    setSelectedSlotId(String(slot.id));
    setMultiBookingMode(false);
    setBookingOpen(true);
  }

  function handleOpenMultiBooking() {
    if (classrooms.length === 0) {
      toast.error("No classrooms available");
      return;
    }
    setSelectedClassroom(classrooms[0]);
    setSelectedSlotId("");
    setMultiBookingMode(true);
    setBookingOpen(true);
  }

  function handleBookingSuccess() {
    toast.success("Booking requested successfully");
    setBookingOpen(false);
    // Refresh bookings for the current date
    const groupParam = selectedGroupId === "all" ? "" : selectedGroupId;
    const bookingsUrl = groupParam
      ? `/api/bookings?date=${selectedDate}&groupId=${groupParam}`
      : `/api/bookings?date=${selectedDate}`;

    fetch(bookingsUrl)
      .then((res) => res.json())
      .then((bookingData) => {
        setBookings(bookingData.bookings || []);
      })
      .catch(() => toast.error("Failed to refresh bookings"));
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
              <CalendarDays className="h-4 w-4 text-foreground" />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-foreground">
                Booking Grid
              </h2>
              <p className="text-xs text-muted-foreground">
                Choose a room and time slot to request a booking.
              </p>
            </div>
          </div>
          <Button onClick={handleOpenMultiBooking} variant="outline" size="sm">
            <PlusCircle className="mr-2 h-4 w-4" />
            Book Multiple Slots
          </Button>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <div className="space-y-4">
          <div className="rounded-lg border bg-background p-4">
            <label className="text-xs font-medium text-muted-foreground">
              Room Group
            </label>
            <Select
              value={selectedGroupId}
              onValueChange={setSelectedGroupId}
            >
              <SelectTrigger className="mt-3 w-full">
                <SelectValue placeholder="All Groups" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Groups</SelectItem>
                {roomGroups.map((group) => (
                  <SelectItem key={group.id} value={String(group.id)}>
                    {group.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-lg border bg-background p-4">
            <label className="text-xs font-medium text-muted-foreground">
              Session
            </label>
            <Select
              value={selectedSessionId}
              onValueChange={setSelectedSessionId}
            >
              <SelectTrigger className="mt-3 w-full">
                <SelectValue placeholder="Select session" />
              </SelectTrigger>
              <SelectContent>
                {sessions.map((session) => (
                  <SelectItem key={session.id} value={String(session.id)}>
                    {session.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-lg border bg-background p-4">
            <label className="text-xs font-medium text-muted-foreground">
              Date
            </label>
            <Input
              type="date"
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.target.value)}
              className="mt-3 w-full"
            />
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button variant="outline" size="sm" onClick={handlePrevDay}>
            <ChevronLeft className="mr-1 h-4 w-4" />
            Previous Day
          </Button>
          <Badge variant="secondary" className="font-mono text-xs">
            {selectedDate}
          </Badge>
          <Button variant="outline" size="sm" onClick={handleNextDay}>
            Next Day
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <div className="overflow-x-auto rounded-xl border bg-background">
          <div className="min-w-[900px]">
            <table className="w-full border-separate border-spacing-0">
              <thead>
                <tr>
                  <th className="border-b bg-muted/40 px-5 py-4 text-left text-sm font-semibold text-foreground">
                    Room
                  </th>
                  {timeSlots.map((slot, index) => (
                    <th
                      key={slot.id}
                      className={`border-b bg-muted/40 px-4 py-4 text-center text-sm font-semibold text-foreground ${
                        index === timeSlots.length - 1 ? "" : "border-l"
                      }`}
                    >
                      <div>{slot.label}</div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {slot.start_time} - {slot.end_time}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {classrooms.map((classroom, rowIndex) => (
                  <tr
                    key={classroom.id}
                    className={rowIndex % 2 ? "bg-muted/20" : "bg-background"}
                  >
                    <td className="border-b px-5 py-4 text-sm font-semibold text-foreground">
                      {classroom.name}
                    </td>
                    {timeSlots.map((slot, colIndex) => {
                      const booking = bookingMap.get(
                        `${classroom.id}-${slot.id}`
                      );
                      const isBooked = Boolean(booking);

                      return (
                        <td
                          key={slot.id}
                          className={`border-b px-4 py-4 text-center text-xs ${
                            colIndex === timeSlots.length - 1 ? "" : "border-l"
                          }`}
                        >
                          {isBooked ? (
                            <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-3 text-rose-700">
                              <div className="text-[0.7rem] font-semibold">
                                Booked
                              </div>
                              <div className="text-[0.65rem] text-rose-600">
                                {booking.user_name || "Reserved"}
                              </div>
                            </div>
                          ) : (
                            <button
                              type="button"
                              className="w-full rounded-md border border-emerald-200 bg-emerald-50 px-3 py-3 text-[0.7rem] font-semibold text-emerald-700 transition hover:bg-emerald-100"
                              onClick={() => handleOpenBooking(classroom, slot)}
                            >
                              Available
                            </button>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <BookingDialog
        open={bookingOpen}
        onOpenChange={setBookingOpen}
        classroom={selectedClassroom}
        classrooms={classrooms}
        initialDate={selectedDate}
        initialTimeSlotId={selectedSlotId}
        lockDate={!multiBookingMode}
        lockTimeSlot={!multiBookingMode}
        multiSelect={multiBookingMode}
        onSuccess={handleBookingSuccess}
      />
    </div>
  );
}
