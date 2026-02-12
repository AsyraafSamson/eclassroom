"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, MoreHorizontal, Pencil, Trash2, Clock3 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DeleteDialog } from "@/components/delete-dialog";

function TimeSlotDialog({ open, onOpenChange, timeSlot, onSuccess }) {
  const isEdit = !!timeSlot;
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ label: "", startTime: "", endTime: "" });

  useEffect(() => {
    if (timeSlot) {
      setForm({ label: timeSlot.label, startTime: timeSlot.start_time, endTime: timeSlot.end_time });
    } else {
      setForm({ label: "", startTime: "", endTime: "" });
    }
  }, [timeSlot, open]);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const url = isEdit ? `/api/time-slots/${timeSlot.id}` : "/api/time-slots";
      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onSuccess?.(data.timeSlot);
      onOpenChange(false);
    } catch (error) {
      toast.error(error?.message || "Failed to save time slot");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Time Slot" : "Add Time Slot"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Update time slot details." : "Create a new booking time slot."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="slotLabel">Label *</Label>
            <Input
              id="slotLabel"
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
              placeholder="e.g. Slot 1"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="slotStart">Start Time *</Label>
              <Input
                id="slotStart"
                type="time"
                value={form.startTime}
                onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slotEnd">End Time *</Label>
              <Input
                id="slotEnd"
                type="time"
                value={form.endTime}
                onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : isEdit ? "Save Changes" : "Create Slot"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function SchedulesPage() {
  const [timeSlots, setTimeSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  const fetchSlots = useCallback(async () => {
    try {
      const res = await fetch("/api/time-slots");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setTimeSlots(data.timeSlots || []);
    } catch (error) {
      toast.error(error?.message || "Failed to load time slots");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSlots(); }, [fetchSlots]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-7 w-40" />
        <div className="rounded-lg border"><div className="space-y-2 p-4">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
        </div></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-semibold font-[var(--font-display)]">Time Slots</h2>
            <Badge variant="secondary">{timeSlots.length}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">Configure booking time slots</p>
        </div>
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />Add Slot
        </Button>
      </div>

      {timeSlots.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border py-12 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
            <Clock3 className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="font-medium">No time slots yet</p>
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Label</TableHead>
                <TableHead>Start</TableHead>
                <TableHead>End</TableHead>
                <TableHead className="w-[70px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {timeSlots.map((slot) => (
                <TableRow key={slot.id}>
                  <TableCell className="font-medium">{slot.label}</TableCell>
                  <TableCell>{slot.start_time}</TableCell>
                  <TableCell>{slot.end_time}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => { setSelected(slot); setEditOpen(true); }}>
                          <Pencil className="mr-2 h-4 w-4" />Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => { setSelected(slot); setDeleteOpen(true); }}>
                          <Trash2 className="mr-2 h-4 w-4" />Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <TimeSlotDialog open={addOpen} onOpenChange={setAddOpen} timeSlot={null} onSuccess={() => { toast.success("Time slot created"); fetchSlots(); }} />
      <TimeSlotDialog open={editOpen} onOpenChange={setEditOpen} timeSlot={selected} onSuccess={() => { toast.success("Time slot updated"); fetchSlots(); }} />
      <DeleteDialog open={deleteOpen} onOpenChange={setDeleteOpen} title="Delete Time Slot" description={`Delete "${selected?.label}"? Existing bookings using this slot may be affected.`} apiUrl={selected ? `/api/time-slots/${selected.id}` : null} onSuccess={() => { toast.success("Time slot deleted"); fetchSlots(); }} />
    </div>
  );
}
