"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, MoreHorizontal, Pencil, Trash2, Calendar } from "lucide-react";
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

function HolidayDialog({ open, onOpenChange, holiday, sessions, onSuccess }) {
  const isEdit = !!holiday;
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    sessionId: "", holidayName: "", description: "", date: "", endDate: "",
  });

  useEffect(() => {
    if (holiday) {
      setForm({
        sessionId: holiday.session_id ? String(holiday.session_id) : "",
        holidayName: holiday.holiday_name || "",
        description: holiday.description || "",
        date: holiday.date || "",
        endDate: holiday.end_date || "",
      });
    } else {
      setForm({ sessionId: "", holidayName: "", description: "", date: "", endDate: "" });
    }
  }, [holiday, open]);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const url = isEdit ? `/api/holidays/${holiday.id}` : "/api/holidays";
      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          sessionId: form.sessionId ? parseInt(form.sessionId, 10) : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onSuccess?.(data.holiday);
      onOpenChange(false);
    } catch (error) {
      toast.error(error?.message || "Failed to save holiday");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Holiday" : "Add Holiday"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Update holiday details." : "Add a public holiday or closure."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="holidayName">Holiday Name *</Label>
            <Input
              id="holidayName"
              value={form.holidayName}
              onChange={(e) => setForm({ ...form, holidayName: e.target.value })}
              placeholder="e.g. Hari Raya Aidilfitri"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="holidayDesc">Description</Label>
            <Input
              id="holidayDesc"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Optional description"
            />
          </div>
          <div className="space-y-2">
            <Label>Session</Label>
            <Select
              value={form.sessionId}
              onValueChange={(v) => setForm({ ...form, sessionId: v === "none" ? "" : v })}
            >
              <SelectTrigger><SelectValue placeholder="Select session..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {sessions.map((s) => (
                  <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="holidayDate">Start Date *</Label>
              <Input
                id="holidayDate"
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="holidayEndDate">End Date</Label>
              <Input
                id="holidayEndDate"
                type="date"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : isEdit ? "Save Changes" : "Add Holiday"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function HolidaysPage() {
  const [holidays, setHolidays] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterSession, setFilterSession] = useState("all");
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  const fetchHolidays = useCallback(async () => {
    try {
      const params = filterSession !== "all" ? `?sessionId=${filterSession}` : "";
      const res = await fetch(`/api/holidays${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const sorted = (data.holidays || []).sort((a, b) => a.date.localeCompare(b.date));
      setHolidays(sorted);
    } catch (error) {
      toast.error(error?.message || "Failed to load holidays");
    } finally {
      setLoading(false);
    }
  }, [filterSession]);

  useEffect(() => {
    fetch("/api/sessions").then((r) => r.json())
      .then((data) => setSessions(data.sessions || []))
      .catch(() => {});
  }, []);

  useEffect(() => { setLoading(true); fetchHolidays(); }, [fetchHolidays]);

  if (loading && holidays.length === 0) {
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
            <h2 className="text-2xl font-semibold font-[var(--font-display)]">Holidays</h2>
            <Badge variant="secondary">{holidays.length}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">Manage public holidays and closures</p>
        </div>
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />Add Holiday
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

      {holidays.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border py-12 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
            <Calendar className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="font-medium">No holidays found</p>
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Holiday</TableHead>
                <TableHead>Session</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead className="w-[70px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {holidays.map((h) => (
                <TableRow key={h.id}>
                  <TableCell className="font-medium">{h.holiday_name}</TableCell>
                  <TableCell className={!h.session_name ? "text-muted-foreground" : ""}>
                    {h.session_name || "—"}
                  </TableCell>
                  <TableCell>{h.date}</TableCell>
                  <TableCell className={!h.end_date ? "text-muted-foreground" : ""}>
                    {h.end_date || "—"}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => { setSelected(h); setEditOpen(true); }}>
                          <Pencil className="mr-2 h-4 w-4" />Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => { setSelected(h); setDeleteOpen(true); }}>
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

      <HolidayDialog open={addOpen} onOpenChange={setAddOpen} holiday={null} sessions={sessions} onSuccess={() => { toast.success("Holiday created"); fetchHolidays(); }} />
      <HolidayDialog open={editOpen} onOpenChange={setEditOpen} holiday={selected} sessions={sessions} onSuccess={() => { toast.success("Holiday updated"); fetchHolidays(); }} />
      <DeleteDialog open={deleteOpen} onOpenChange={setDeleteOpen} title="Delete Holiday" description={`Delete "${selected?.holiday_name}"?`} apiUrl={selected ? `/api/holidays/${selected.id}` : null} onSuccess={() => { toast.success("Holiday deleted"); fetchHolidays(); }} />
    </div>
  );
}
