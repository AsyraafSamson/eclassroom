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
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DeleteDialog } from "@/components/delete-dialog";

function SessionDialog({ open, onOpenChange, session, onSuccess }) {
  const isEdit = !!session;
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", startDate: "", endDate: "" });

  useEffect(() => {
    if (session) {
      setForm({ name: session.name, startDate: session.start_date, endDate: session.end_date });
    } else {
      setForm({ name: "", startDate: "", endDate: "" });
    }
  }, [session, open]);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const url = isEdit ? `/api/sessions/${session.id}` : "/api/sessions";
      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onSuccess?.(data.session);
      onOpenChange(false);
    } catch (error) {
      toast.error(error?.message || "Failed to save session");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Session" : "Add Session"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Update session details." : "Create a new academic session."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="sessionName">Name *</Label>
            <Input
              id="sessionName"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Semester 1 2025/2026"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date *</Label>
              <Input
                id="startDate"
                type="date"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date *</Label>
              <Input
                id="endDate"
                type="date"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : isEdit ? "Save Changes" : "Create Session"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  const fetchSessions = useCallback(async () => {
    try {
      const res = await fetch("/api/sessions");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSessions(data.sessions || []);
    } catch (error) {
      toast.error(error?.message || "Failed to load sessions");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  const today = new Date().toISOString().slice(0, 10);

  if (loading) {
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
            <h2 className="text-2xl font-semibold font-[var(--font-display)]">Sessions</h2>
            <Badge variant="secondary">{sessions.length}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">Manage academic sessions and terms</p>
        </div>
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />Add Session
        </Button>
      </div>

      {sessions.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border py-12 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
            <Calendar className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="font-medium">No sessions yet</p>
          <p className="text-sm text-muted-foreground">Create your first academic session.</p>
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[70px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions.map((session) => {
                const isCurrent = today >= session.start_date && today <= session.end_date;
                const isPast = today > session.end_date;
                return (
                  <TableRow key={session.id}>
                    <TableCell className="font-medium">{session.name}</TableCell>
                    <TableCell>{session.start_date}</TableCell>
                    <TableCell>{session.end_date}</TableCell>
                    <TableCell>
                      <Badge variant={isCurrent ? "default" : isPast ? "secondary" : "outline"}>
                        {isCurrent ? "Current" : isPast ? "Past" : "Upcoming"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => { setSelected(session); setEditOpen(true); }}>
                            <Pencil className="mr-2 h-4 w-4" />Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={() => { setSelected(session); setDeleteOpen(true); }}>
                            <Trash2 className="mr-2 h-4 w-4" />Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <SessionDialog open={addOpen} onOpenChange={setAddOpen} session={null} onSuccess={() => { toast.success("Session created"); fetchSessions(); }} />
      <SessionDialog open={editOpen} onOpenChange={setEditOpen} session={selected} onSuccess={() => { toast.success("Session updated"); fetchSessions(); }} />
      <DeleteDialog open={deleteOpen} onOpenChange={setDeleteOpen} title="Delete Session" description={`Delete "${selected?.name}"? This will also remove related holidays and timetable weeks.`} apiUrl={selected ? `/api/sessions/${selected.id}` : null} onSuccess={() => { toast.success("Session deleted"); fetchSessions(); }} />
    </div>
  );
}
