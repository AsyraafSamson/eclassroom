"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
}) {
  const [loading, setLoading] = useState(false);
  const [timeSlots, setTimeSlots] = useState([]);
  const [form, setForm] = useState({
    bookingDate: "",
    timeSlotId: "",
    purpose: "",
  });

  useEffect(() => {
    if (!open) return;

    setForm({
      bookingDate: initialDate || "",
      timeSlotId: initialTimeSlotId || "",
      purpose: "",
    });

    fetch("/api/time-slots")
      .then((res) => res.json())
      .then((data) => setTimeSlots(data.timeSlots || []))
      .catch(() => {
        toast.error("Failed to load time slots");
      });
  }, [open, initialDate, initialTimeSlotId]);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!classroom) return;

    setLoading(true);

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classroomId: classroom.id,
          bookingDate: form.bookingDate,
          timeSlotId: form.timeSlotId,
          purpose: form.purpose,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create booking");
      }

      onSuccess?.(data.booking);
      onOpenChange(false);
      toast.success("Booking requested successfully");
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
          <DialogTitle>Book Classroom</DialogTitle>
          <DialogDescription>
            {classroom?.name
              ? `Request a booking for ${classroom.name}.`
              : "Request a booking."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bookingDate">Date *</Label>
            <Input
              id="bookingDate"
              type="date"
              value={form.bookingDate}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, bookingDate: event.target.value }))
              }
              disabled={lockDate}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="timeSlot">Time Slot *</Label>
            <Select
              value={form.timeSlotId}
              onValueChange={(value) =>
                setForm((prev) => ({ ...prev, timeSlotId: value }))
              }
              disabled={lockTimeSlot}
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
          </div>
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
              {loading ? "Submitting..." : "Submit Request"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
