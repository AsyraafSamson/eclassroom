"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function BookingDialog({
  open,
  onOpenChange,
  classroom,
  onSuccess,
  initialDate,
  initialTimeSlotId,
  lockDate = false,
  lockTimeSlot = false,
  multiSelect = false,
  classrooms = [],
  editBooking = null,
  currentUser = null,
}) {
  const [loading, setLoading] = useState(false);
  const [timeSlots, setTimeSlots] = useState([]);
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [selectedClassroomId, setSelectedClassroomId] = useState("");
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [form, setForm] = useState({
    bookingDate: "",
    timeSlotId: "",
    purpose: "",
  });

  useEffect(() => {
    if (!open) return;

    setForm({
      bookingDate: editBooking?.booking_date || initialDate || "",
      timeSlotId: editBooking ? String(editBooking.time_slot_id) : initialTimeSlotId || "",
      purpose: editBooking?.purpose || "",
    });
    setSelectedUserId("");

    if (multiSelect) {
      setSelectedSlots(initialTimeSlotId ? [initialTimeSlotId] : []);
      setSelectedClassroomId(classroom?.id ? String(classroom.id) : "");
    }

    fetch("/api/time-slots")
      .then((res) => res.json())
      .then((data) => setTimeSlots(data.timeSlots || []))
      .catch(() => {
        toast.error("Failed to load time slots");
      });

    // Admin: fetch user list for "book on behalf of"
    if (currentUser?.role === "admin" && !editBooking) {
      fetch("/api/users")
        .then((res) => res.json())
        .then((data) => setUsers(data.users || []))
        .catch(() => {});
    }
  }, [open, initialDate, initialTimeSlotId, multiSelect, classroom, currentUser, editBooking]);

  async function handleSubmit(event) {
    event.preventDefault();
    
    const classroomId = multiSelect && selectedClassroomId 
      ? selectedClassroomId 
      : classroom?.id;
      
    if (!classroomId) {
      toast.error("Please select a classroom");
      return;
    }

    const slotsToBook = multiSelect ? selectedSlots : [form.timeSlotId];

    if (slotsToBook.length === 0) {
      toast.error("Please select at least one time slot");
      return;
    }

    setLoading(true);

    try {
      if (editBooking) {
        // Edit existing booking
        const res = await fetch(`/api/bookings/${editBooking.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ purpose: form.purpose }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to update booking");
        }

        onSuccess?.(data.booking);
        onOpenChange(false);
        toast.success("Booking updated successfully");
      } else if (multiSelect) {
        // Create multiple bookings
        const res = await fetch("/api/bookings/bulk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            classroomId: parseInt(classroomId, 10),
            bookingDate: form.bookingDate,
            timeSlotIds: slotsToBook,
            purpose: form.purpose,
            ...(selectedUserId && { userId: parseInt(selectedUserId, 10) }),
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to create bookings");
        }

        onSuccess?.(data.bookings);
        onOpenChange(false);
        toast.success(`${data.bookings.length} booking(s) requested successfully`);
      } else {
        // Single booking
        const res = await fetch("/api/bookings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            classroomId: parseInt(classroomId, 10),
            bookingDate: form.bookingDate,
            timeSlotId: form.timeSlotId,
            purpose: form.purpose,
            ...(selectedUserId && { userId: parseInt(selectedUserId, 10) }),
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to create booking");
        }

        onSuccess?.(data.booking);
        onOpenChange(false);
        toast.success("Booking requested successfully");
      }
    } catch (error) {
      toast.error(error?.message || "Failed to create booking");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{editBooking ? "Edit Booking" : "Book Classroom"}</DialogTitle>
          <DialogDescription>
            {editBooking
              ? `Edit your booking for ${editBooking.classroom_name || "this classroom"}.`
              : multiSelect
              ? "Select classrooms and time slots to book multiple at once."
              : classroom?.name
              ? `Request a booking for ${classroom.name}.`
              : "Request a booking."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {multiSelect && classrooms.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="classroom">Classroom *</Label>
              <Select
                value={selectedClassroomId}
                onValueChange={setSelectedClassroomId}
              >
                <SelectTrigger id="classroom" className="w-full">
                  <SelectValue placeholder="Select classroom" />
                </SelectTrigger>
                <SelectContent>
                  {classrooms.map((room) => (
                    <SelectItem key={room.id} value={String(room.id)}>
                      {room.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="bookingDate">Date *</Label>
            <Input
              id="bookingDate"
              type="date"
              value={form.bookingDate}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, bookingDate: event.target.value }))
              }
              disabled={lockDate || !!editBooking}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="timeSlot">Time Slot{multiSelect ? "s" : ""} *</Label>
            {multiSelect ? (
              <div className="max-h-60 space-y-2 overflow-y-auto rounded-md border p-3">
                {timeSlots.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No slots available</p>
                ) : (
                  timeSlots.map((slot) => (
                    <div key={slot.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`slot-${slot.id}`}
                        checked={selectedSlots.includes(String(slot.id))}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedSlots((prev) => [...prev, String(slot.id)]);
                          } else {
                            setSelectedSlots((prev) =>
                              prev.filter((id) => id !== String(slot.id))
                            );
                          }
                        }}
                        disabled={lockTimeSlot}
                      />
                      <label
                        htmlFor={`slot-${slot.id}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {slot.label} ({slot.start_time} - {slot.end_time})
                      </label>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <Select
                value={form.timeSlotId}
                onValueChange={(value) =>
                  setForm((prev) => ({ ...prev, timeSlotId: value }))
                }
                disabled={lockTimeSlot || !!editBooking}
              >
                <SelectTrigger id="timeSlot" className="w-full">
                  <SelectValue placeholder="Select time slot" />
                </SelectTrigger>
                <SelectContent>
                  {timeSlots.length === 0 && (
                    <SelectItem value="no-slots" disabled>
                      No slots available
                    </SelectItem>
                  )}
                  {timeSlots.map((slot) => (
                    <SelectItem key={slot.id} value={String(slot.id)}>
                      {slot.label} ({slot.start_time} - {slot.end_time})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          {currentUser?.role === "admin" && !editBooking && users.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="bookForUser">Book for User</Label>
              <Select
                value={selectedUserId}
                onValueChange={(val) => setSelectedUserId(val === "self" ? "" : val)}
              >
                <SelectTrigger id="bookForUser" className="w-full">
                  <SelectValue placeholder="Myself (default)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="self">Myself ({currentUser.username})</SelectItem>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={String(u.id)}>
                      {u.username} {u.full_name ? `(${u.full_name})` : ""} - {u.role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="purpose">Purpose</Label>
            <Textarea
              id="purpose"
              value={form.purpose}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, purpose: event.target.value }))
              }
              placeholder="Describe the purpose of this booking"
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Submitting..." : editBooking ? "Save Changes" : "Submit Request"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
