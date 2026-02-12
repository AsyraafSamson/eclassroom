"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, MoreHorizontal, Pencil, Trash2, CalendarClock } from "lucide-react";
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
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DeleteDialog } from "@/components/delete-dialog";

function WeekDialog({ open, onOpenChange, week, sessions, onSuccess }) {
  const isEdit = !!week;
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    sessionId: "", weekNumber: "", startDate: "", endDate: "", label: "",
  });

  useEffect(() => {
    if (week) {
      setForm({
        sessionId: String(week.session_id),
        weekNumber: String(week.week_number),
        startDate: week.start_date,
        endDate: week.end_date,
        label: week.label || "",
      });
    } else {
      setForm({ sessionId: "", weekNumber: "", startDate: "", endDate: "", label: "" });
    }
  }, [week, open]);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const url = isEdit ? `/api/timetable-weeks/${week.id}` : "/api/timetable-weeks";
      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: parseInt(form.sessionId, 10),
          weekNumber: parseInt(form.weekNumber, 10),
          startDate: form.startDate,
          endDate: form.endDate,
          label: form.label || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onSuccess?.(data.timetableWeek);
      onOpenChange(false);
    } catch (error) {
      toast.error(error?.message || "Failed to save week");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Week" : "Add Week"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Update timetable week." : "Add a new timetable week."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Session *</Label>
              <Select value={form.sessionId} onValueChange={(v) => setForm({ ...form, sessionId: v })}>
                <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>
                  {sessions.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="weekNum">Week Number *</Label>
              <Input id="weekNum" type="number" min="1" value={form.weekNumber} onChange={(e) => setForm({ ...form, weekNumber: e.target.value })} required />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="weekLabel">Label</Label>
            <Input id="weekLabel" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="e.g. Week 1 - Orientation" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="weekStart">Start Date *</Label>
              <Input id="weekStart" type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="weekEnd">End Date *</Label>
              <Input id="weekEnd" type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} required />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : isEdit ? "Save Changes" : "Add Week"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function TimetableWeeksPage() {
  const [weeks, setWeeks] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterSession, setFilterSession] = useState("all");
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  const fetchWeeks = useCallback(async () => {
    try {
      const params = filterSession !== "all" ? `?sessionId=${filterSession}` : "";
      const res = await fetch(`/api/timetable-weeks${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setWeeks(data.timetableWeeks || []);
    } catch (error) {
      toast.error(error?.message || "Failed to load weeks");
    } finally {
      setLoading(false);
    }
  }, [filterSession]);

  useEffect(() => {
    fetch("/api/sessions").then((r) => r.json())
      .then((data) => setSessions(data.sessions || []))
      .catch(() => {});
  }, []);

  useEffect(() => { setLoading(true); fetchWeeks(); }, [fetchWeeks]);

  if (loading && weeks.length === 0) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-7 w-40" />
        <div className="rounded-lg border"><div className="space-y-2 p-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
        </div></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-semibold font-[var(--font-display)]">Timetable Weeks</h2>
            <Badge variant="secondary">{weeks.length}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">Configure weekly academic timetables</p>
        </div>
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />Add Week
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <Select value={filterSession} onValueChange={setFilterSession}>
          <SelectTrigger className="w-52"><SelectValue placeholder="All Sessions" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sessions</SelectItem>
            {sessions.map((s) => (
              <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {weeks.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border py-12 text-center">
          <CalendarClock className="h-8 w-8 text-muted-foreground" />
          <p className="font-medium">No timetable weeks found</p>
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Week</TableHead>
                <TableHead>Label</TableHead>
                <TableHead>Session</TableHead>
                <TableHead>Start</TableHead>
                <TableHead>End</TableHead>
                <TableHead className="w-[70px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {weeks.map((w) => (
                <TableRow key={w.id}>
                  <TableCell className="font-medium">Week {w.week_number}</TableCell>
                  <TableCell className={!w.label ? "text-muted-foreground" : ""}>{w.label || "—"}</TableCell>
                  <TableCell>{w.session_name || "—"}</TableCell>
                  <TableCell>{w.start_date}</TableCell>
                  <TableCell>{w.end_date}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => { setSelected(w); setEditOpen(true); }}>
                          <Pencil className="mr-2 h-4 w-4" />Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => { setSelected(w); setDeleteOpen(true); }}>
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

      <WeekDialog open={addOpen} onOpenChange={setAddOpen} week={null} sessions={sessions} onSuccess={() => { toast.success("Week added"); fetchWeeks(); }} />
      <WeekDialog open={editOpen} onOpenChange={setEditOpen} week={selected} sessions={sessions} onSuccess={() => { toast.success("Week updated"); fetchWeeks(); }} />
      <DeleteDialog open={deleteOpen} onOpenChange={setDeleteOpen} title="Delete Week" description={`Delete Week ${selected?.week_number}?`} apiUrl={selected ? `/api/timetable-weeks/${selected.id}` : null} onSuccess={() => { toast.success("Week deleted"); fetchWeeks(); }} />
    </div>
  );
}
