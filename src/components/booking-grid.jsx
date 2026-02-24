"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Ban,
  Gift,
  Laptop2,
  Pencil,
  PlusCircle,
  Trash2,
  User,
} from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  const [currentUser, setCurrentUser] = useState(null);

  const [selectedSessionId, setSelectedSessionId] = useState("");
  const [selectedGroupId, setSelectedGroupId] = useState("all");
  const [selectedDate, setSelectedDate] = useState(dateFromUrl || getTodayString());

  const [bookingOpen, setBookingOpen] = useState(false);
  const [selectedClassroom, setSelectedClassroom] = useState(null);
  const [selectedSlotId, setSelectedSlotId] = useState("");
  const [multiBookingMode, setMultiBookingMode] = useState(false);
  const [editingBooking, setEditingBooking] = useState(null);

  const [bookingQuota, setBookingQuota] = useState(null);
  const [holidays, setHolidays] = useState([]);
  const [detailClassroom, setDetailClassroom] = useState(null);
  const [detailEquipment, setDetailEquipment] = useState([]);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => setCurrentUser(data.user || null))
      .catch(() => {});

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

  // Fetch booking quota and holidays when session changes
  useEffect(() => {
    if (!selectedSessionId) return;

    fetch(`/api/bookings/count?sessionId=${selectedSessionId}`)
      .then((res) => res.json())
      .then((data) => setBookingQuota(data))
      .catch(() => {});

    fetch(`/api/holidays?sessionId=${selectedSessionId}`)
      .then((res) => res.json())
      .then((data) => setHolidays(data.holidays || []))
      .catch(() => {});
  }, [selectedSessionId]);

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

  function isSlotPassed(date, endTime) {
    const now = new Date();
    const slotEnd = new Date(`${date}T${endTime}`);
    return slotEnd < now;
  }

  function handleOpenBooking(classroom, slot) {
    setEditingBooking(null);
    setSelectedClassroom(classroom);
    setSelectedSlotId(String(slot.id));
    setMultiBookingMode(false);
    setBookingOpen(true);
  }

  function handleEditBooking(booking) {
    setEditingBooking(booking);
    setSelectedClassroom(null);
    setSelectedSlotId("");
    setMultiBookingMode(false);
    setBookingOpen(true);
  }

  async function handleDeleteBooking(bookingId) {
    try {
      const res = await fetch(`/api/bookings/${bookingId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete booking");
      }
      toast.success("Booking deleted");
      handleBookingSuccess();
    } catch (error) {
      toast.error(error?.message || "Failed to delete booking");
    }
  }

  function handleOpenMultiBooking() {
    if (classrooms.length === 0) {
      toast.error("No classrooms available");
      return;
    }
    setEditingBooking(null);
    setSelectedClassroom(classrooms[0]);
    setSelectedSlotId("");
    setMultiBookingMode(true);
    setBookingOpen(true);
  }

  function refreshQuota() {
    if (selectedSessionId) {
      fetch(`/api/bookings/count?sessionId=${selectedSessionId}`)
        .then((res) => res.json())
        .then((data) => setBookingQuota(data))
        .catch(() => {});
    }
  }

  function handleBookingSuccess() {
    setBookingOpen(false);
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

    refreshQuota();
  }

  const isAdmin = currentUser?.role === "admin";
  const remaining = bookingQuota ? bookingQuota.limit - bookingQuota.activeCount : null;

  function getHolidayForDate(date) {
    return holidays.find((h) => {
      if (!h.is_enabled) return false;
      if (h.end_date) {
        return date >= h.date && date <= h.end_date;
      }
      return date === h.date;
    });
  }

  const holidayForSelectedDate = getHolidayForDate(selectedDate);

  async function handleShowClassroomDetail(classroom) {
    setDetailClassroom(classroom);
    setDetailEquipment([]);
    setDetailOpen(true);
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/classrooms/${classroom.id}/equipment`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setDetailEquipment(
        (data.equipment || []).filter(
          (e) => e.value !== null && e.value !== ""
        )
      );
    } catch {
      toast.error("Failed to load equipment");
    } finally {
      setDetailLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold text-foreground">
            Booking Grid
          </h2>
        </div>
        <Button onClick={handleOpenMultiBooking} variant="outline" size="sm">
          <PlusCircle className="mr-2 h-4 w-4" />
          Book Multiple Slots
        </Button>
      </div>

      {/* Filters: Session + Date */}
      <div className="rounded-xl border bg-card p-4 shadow-sm">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Session
            </label>
            <Select
              value={selectedSessionId}
              onValueChange={setSelectedSessionId}
            >
              <SelectTrigger className="w-full">
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

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Date
            </label>
            <Input
              type="date"
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.target.value)}
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* Room Group Tabs */}
      <div className="rounded-xl border bg-card p-3 shadow-sm">
        <label className="mb-2 block text-xs font-medium text-muted-foreground">
          Room Categories
        </label>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSelectedGroupId("all")}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
              selectedGroupId === "all"
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background text-foreground hover:bg-muted"
            }`}
          >
            All Groups
          </button>
          {roomGroups.map((group) => (
            <button
              key={group.id}
              type="button"
              onClick={() => setSelectedGroupId(String(group.id))}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                selectedGroupId === String(group.id)
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-foreground hover:bg-muted"
              }`}
            >
              {group.name}
              <span
                className={`inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[0.6rem] ${
                  selectedGroupId === String(group.id)
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {group.room_count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Day Navigation */}
      <div className="flex items-center justify-between gap-3">
        <Button variant="outline" size="sm" onClick={handlePrevDay}>
          <ChevronLeft className="mr-1 h-4 w-4" />
          Previous
        </Button>
        <Badge variant="secondary" className="font-mono text-xs">
          {selectedDate}
        </Badge>
        <Button variant="outline" size="sm" onClick={handleNextDay}>
          Next
          <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </div>

      {/* Holiday Banner */}
      {holidayForSelectedDate && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
          <Gift className="h-4 w-4 shrink-0" />
          <span>
            <span className="font-semibold">{holidayForSelectedDate.holiday_name}</span>
            {" — Bookings are disabled for this date."}
          </span>
        </div>
      )}

      {/* Booking Grid Table */}
      <div className="rounded-xl border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-separate border-spacing-0">
            <thead>
              <tr>
                {/* Sticky room column header */}
                <th className="sticky left-0 z-20 border-b border-r bg-muted/40 px-2 sm:px-3 py-2 sm:py-3 text-left text-xs sm:text-sm font-semibold text-foreground w-[90px] sm:w-auto">
                  Room
                </th>
                {timeSlots.map((slot) => (
                  <th
                    key={slot.id}
                    className="border-b border-l bg-muted/40 px-1 sm:px-3 py-2 sm:py-3 text-center text-xs sm:text-sm font-semibold text-foreground min-w-[70px] sm:min-w-0"
                  >
                    <div className="text-[0.65rem] sm:text-sm">{slot.label}</div>
                    <div className="mt-0.5 text-[0.55rem] sm:text-[0.65rem] font-normal text-muted-foreground leading-tight">
                      {slot.start_time}–{slot.end_time}
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
                  {/* Sticky room name cell — explicit bg matches row so it doesn't go transparent on scroll */}
                  <td className={`sticky left-0 z-10 border-b border-r px-2 sm:px-3 py-2 sm:py-3 text-xs sm:text-sm font-semibold text-foreground ${rowIndex % 2 ? "bg-muted/20" : "bg-background"}`}>
                    <button
                      type="button"
                      className="inline-flex w-full items-start gap-1 text-left hover:text-primary hover:underline transition"
                      onClick={() => handleShowClassroomDetail(classroom)}
                    >
                      {/* Mobile: wrap to 2 lines within fixed width */}
                      <span className="sm:hidden line-clamp-2 break-words min-w-0 max-w-[76px] leading-tight">
                        {classroom.name}
                      </span>
                      {/* Desktop: full name no wrap */}
                      <span className="hidden sm:inline whitespace-nowrap">
                        {classroom.name}
                      </span>
                      {!classroom.can_be_booked && (
                        <Ban className="h-3 w-3 text-destructive shrink-0 mt-0.5" />
                      )}
                    </button>
                  </td>

                  {timeSlots.map((slot) => {
                    const booking = bookingMap.get(`${classroom.id}-${slot.id}`);
                    const isBooked = Boolean(booking);
                    const isOwner = currentUser && isBooked && currentUser.id === booking.user_id;
                    const passed = isBooked && isSlotPassed(selectedDate, slot.end_time);
                    const isPastDate = selectedDate < getTodayString();
                    const canModify = isBooked && !passed && (isAdmin || isOwner);
                    const notBookable = !classroom.can_be_booked;
                    const isHoliday = Boolean(holidayForSelectedDate);

                    return (
                      <td
                        key={slot.id}
                        className="border-b border-l px-1 sm:px-2 py-1 sm:py-2 text-center text-xs"
                      >
                        {notBookable ? (
                          <div className="rounded-md border border-gray-200 bg-gray-50 px-1 sm:px-2 py-1.5 sm:py-2 text-gray-400">
                            <Ban className="mx-auto h-3 w-3" />
                            <div className="mt-0.5 text-[0.6rem] sm:text-xs leading-tight">N/A</div>
                          </div>
                        ) : isBooked ? (
                          <div
                            className={`rounded-md border px-1 sm:px-2 py-1.5 sm:py-2 ${
                              passed
                                ? "border-gray-200 bg-gray-50 text-gray-500"
                                : isOwner
                                  ? "border-blue-200 bg-blue-50 text-blue-700"
                                  : "border-rose-200 bg-rose-50 text-rose-700"
                            }`}
                          >
                            <div className="text-[0.6rem] sm:text-xs font-semibold leading-tight">
                              {passed ? "Passed" : isOwner ? "Your Booking" : "Booked"}
                            </div>
                            <div
                              className={`mt-0.5 leading-tight ${
                                passed ? "text-gray-400" : isOwner ? "text-blue-600" : "text-rose-600"
                              }`}
                            >
                              {/* Mobile: first name only; desktop: full name */}
                              <span className="sm:hidden text-[0.55rem]">
                                {(booking.teacher_name || booking.username || "–").split(" ")[0]}
                              </span>
                              <span className="hidden sm:inline text-[0.65rem]">
                                {booking.teacher_name || booking.username || "Reserved"}
                              </span>
                            </div>
                            {canModify && (
                              <div className="mt-1 flex items-center justify-center gap-0.5 sm:gap-1">
                                <button
                                  type="button"
                                  className="inline-flex items-center gap-0.5 rounded px-1 sm:px-1.5 py-0.5 sm:py-1 text-xs text-blue-600 transition hover:bg-blue-100 touch-manipulation"
                                  onClick={() =>
                                    handleEditBooking({
                                      ...booking,
                                      classroom_name: classroom.name,
                                    })
                                  }
                                >
                                  <Pencil className="h-3 w-3" />
                                  <span className="hidden sm:inline">Edit</span>
                                </button>
                                <button
                                  type="button"
                                  className="inline-flex items-center gap-0.5 rounded px-1 sm:px-1.5 py-0.5 sm:py-1 text-xs text-rose-600 transition hover:bg-rose-200 touch-manipulation"
                                  onClick={() => handleDeleteBooking(booking.id)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                  <span className="hidden sm:inline">Del</span>
                                </button>
                              </div>
                            )}
                          </div>
                        ) : isPastDate ? (
                          <div className="rounded-md border border-gray-200 bg-gray-50 px-1 sm:px-2 py-1.5 sm:py-2 text-gray-400">
                            <Clock className="mx-auto h-3 w-3" />
                            <div className="mt-0.5 text-[0.6rem] sm:text-xs leading-tight">Past</div>
                          </div>
                        ) : isHoliday ? (
                          <div className="rounded-md border border-amber-200 bg-amber-50 px-1 sm:px-2 py-1.5 sm:py-2 text-amber-600">
                            <Gift className="mx-auto h-3 w-3" />
                            <div className="mt-0.5 text-[0.6rem] sm:text-xs font-medium leading-tight">Holiday</div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            className="w-full rounded-md border border-emerald-200 bg-emerald-50 px-1 sm:px-2 py-1.5 sm:py-2.5 text-[0.6rem] sm:text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 active:bg-emerald-100 touch-manipulation"
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

      {/* Classroom Details Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Classroom Details</DialogTitle>
          </DialogHeader>
          {detailClassroom && (
            <div className="space-y-4">
              {detailClassroom.photo && (
                <button
                  type="button"
                  className="w-full overflow-hidden rounded-lg border transition hover:opacity-90"
                  onClick={() => setLightboxSrc(detailClassroom.photo)}
                >
                  <img
                    src={detailClassroom.photo}
                    alt={detailClassroom.name}
                    className="h-48 w-full object-cover"
                  />
                </button>
              )}
              <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
                <span className="font-medium text-muted-foreground">Room</span>
                <span>{detailClassroom.name}</span>

                <span className="font-medium text-muted-foreground">Category</span>
                <span>{detailClassroom.group_name || "\u2014"}</span>

                <span className="font-medium text-muted-foreground">Location</span>
                <span>{detailClassroom.location || "\u2014"}</span>

                <span className="font-medium text-muted-foreground">Capacity</span>
                <span>{detailClassroom.capacity ?? "\u2014"}</span>

                <span className="font-medium text-muted-foreground">Status</span>
                <span className="capitalize">{detailClassroom.status}</span>

                <span className="font-medium text-muted-foreground">Bookable</span>
                <span>{detailClassroom.can_be_booked ? "Yes" : "No"}</span>

                {detailClassroom.notes && (
                  <>
                    <span className="font-medium text-muted-foreground">Notes</span>
                    <span>{detailClassroom.notes}</span>
                  </>
                )}
              </div>

              <div className="space-y-2">
                <h4 className="flex items-center gap-2 text-sm font-semibold">
                  <Laptop2 className="h-4 w-4 text-muted-foreground" />
                  Equipment List
                </h4>
                {detailLoading ? (
                  <p className="text-sm text-muted-foreground">Loading...</p>
                ) : detailEquipment.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No equipment assigned to this classroom.
                  </p>
                ) : (
                  <div className="rounded-lg border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Equipment Name</TableHead>
                          <TableHead>Value</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {detailEquipment.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">
                              {item.name}
                            </TableCell>
                            <TableCell>
                              {item.type === "CHECKBOX"
                                ? item.value === "1" || item.value === "true"
                                  ? "Available"
                                  : "Not Available"
                                : item.value}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Legend */}
      <div className="rounded-xl border bg-card p-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-semibold text-muted-foreground">Legend:</span>
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[0.65rem] font-medium text-emerald-700">
            <Check className="h-3 w-3" /> Available
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-[0.65rem] font-medium text-rose-700">
            <User className="h-3 w-3" /> Booked
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[0.65rem] font-medium text-blue-700">
            <User className="h-3 w-3" /> Your Booking
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-[0.65rem] font-medium text-gray-500">
            <Clock className="h-3 w-3" /> Passed / Past Date
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[0.65rem] font-medium text-amber-600">
            <Gift className="h-3 w-3" /> Holiday
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-[0.65rem] font-medium text-gray-400">
            <Ban className="h-3 w-3" /> Not Available
          </span>
          {isAdmin && (
            <span className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-[0.65rem] font-medium text-primary">
              Admin
            </span>
          )}
        </div>
      </div>

      {/* Booking Quota */}
      {bookingQuota && !isAdmin && (
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="text-xs font-semibold text-muted-foreground">
                Booking Quota
              </div>
              <div className="text-sm text-foreground">
                <span className="font-semibold">{remaining}</span> slots remaining of your{" "}
                <span className="font-semibold">{bookingQuota.limit}</span> booking quota
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-32 overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full rounded-full transition-all ${
                    remaining <= 3
                      ? "bg-destructive"
                      : remaining <= 10
                        ? "bg-amber-500"
                        : "bg-emerald-500"
                  }`}
                  style={{
                    width: `${Math.max(0, Math.min(100, ((bookingQuota.limit - remaining) / bookingQuota.limit) * 100))}%`,
                  }}
                />
              </div>
              <span className="text-xs text-muted-foreground">
                {bookingQuota.activeCount}/{bookingQuota.limit}
              </span>
            </div>
          </div>
        </div>
      )}

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
        editBooking={editingBooking}
        currentUser={currentUser}
        onSuccess={handleBookingSuccess}
      />

      {/* Image Lightbox */}
      {lightboxSrc && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setLightboxSrc(null)}
        >
          <button
            type="button"
            className="absolute top-4 right-4 rounded-full bg-white/20 p-2 text-white transition hover:bg-white/40"
            onClick={() => setLightboxSrc(null)}
          >
            <Ban className="h-5 w-5" />
          </button>
          <img
            src={lightboxSrc}
            alt="Classroom photo"
            className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
