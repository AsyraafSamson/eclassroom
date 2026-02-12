"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, MoreHorizontal, Pencil, Trash2, Ban } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableCaption,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export default function DisabledPeriodsPage() {
  const [periods, setPeriods] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [periodToDelete, setPeriodToDelete] = useState(null);

  const [formData, setFormData] = useState({
    sessionId: "",
    periodType: "day",
    periodValue: "",
  });

  const fetchPeriods = useCallback(async () => {
    try {
      const res = await fetch("/api/disabled-periods");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPeriods(data.disabledPeriods || []);
    } catch (error) {
      toast.error("Failed to load disabled periods");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    Promise.all([
      fetch("/api/sessions").then((r) => r.json()),
      fetchPeriods(),
    ]).then(([sessionsData]) => {
      setSessions(sessionsData.sessions || []);
    });
  }, [fetchPeriods]);

  function openAddDialog() {
    setSelectedPeriod(null);
    setFormData({
      sessionId: sessions.length > 0 ? String(sessions[0].id) : "",
      periodType: "day",
      periodValue: "",
    });
    setDialogOpen(true);
  }

  function openEditDialog(period) {
    setSelectedPeriod(period);
    setFormData({
      sessionId: String(period.session_id),
      periodType: period.period_type,
      periodValue: period.period_value,
    });
    setDialogOpen(true);
  }

  async function handleSubmit() {
    if (!formData.sessionId || !formData.periodValue.trim()) {
      toast.error("All fields are required");
      return;
    }

    try {
      const url = selectedPeriod
        ? `/api/disabled-periods/${selectedPeriod.id}`
        : "/api/disabled-periods";
      
      const method = selectedPeriod ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: parseInt(formData.sessionId),
          periodType: formData.periodType,
          periodValue: formData.periodValue.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success(
        selectedPeriod
          ? "Disabled period updated"
          : "Disabled period created"
      );
      setDialogOpen(false);
      fetchPeriods();
    } catch (error) {
      toast.error(error?.message || "Failed to save disabled period");
    }
  }

  async function handleDelete() {
    if (!periodToDelete) return;

    try {
      const res = await fetch(`/api/disabled-periods/${periodToDelete.id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success("Disabled period deleted");
      setDeleteOpen(false);
      setPeriodToDelete(null);
      fetchPeriods();
    } catch (error) {
      toast.error(error?.message || "Failed to delete disabled period");
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const periodTypeLabels = {
    day: "Day",
    week: "Week",
    month: "Month",
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-semibold font-[var(--font-display)]">
              Disabled Periods
            </h2>
            <Badge variant="secondary">{periods.length}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Block specific periods from being booked
          </p>
        </div>
        <Button onClick={openAddDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Add Disabled Period
        </Button>
      </div>

      {periods.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border py-12 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
            <Ban className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <p className="font-medium">No disabled periods</p>
            <p className="text-sm text-muted-foreground">
              Add a disabled period to block specific dates
            </p>
          </div>
          <Button variant="outline" className="mt-4" onClick={openAddDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Add your first disabled period
          </Button>
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableCaption>
              Showing {periods.length} disabled period
              {periods.length === 1 ? "" : "s"}
            </TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Session</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-[70px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {periods.map((period) => (
                <TableRow key={period.id}>
                  <TableCell className="font-medium">
                    {period.session_name || `Session ${period.session_id}`}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {periodTypeLabels[period.period_type] || period.period_type}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {period.period_value}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {period.created_at
                      ? new Date(period.created_at).toLocaleDateString()
                      : "—"}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditDialog(period)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => {
                            setPeriodToDelete(period);
                            setDeleteOpen(true);
                          }}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
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

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedPeriod ? "Edit Disabled Period" : "Add Disabled Period"}
            </DialogTitle>
            <DialogDescription>
              {selectedPeriod
                ? "Update the disabled period details."
                : "Block a specific period from being booked."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="session">Session</Label>
              <Select
                value={formData.sessionId}
                onValueChange={(value) =>
                  setFormData({ ...formData, sessionId: value })
                }
              >
                <SelectTrigger id="session">
                  <SelectValue placeholder="Select a session" />
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
            <div className="space-y-2">
              <Label htmlFor="periodType">Period Type</Label>
              <Select
                value={formData.periodType}
                onValueChange={(value) =>
                  setFormData({ ...formData, periodType: value })
                }
              >
                <SelectTrigger id="periodType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Day (YYYY-MM-DD)</SelectItem>
                  <SelectItem value="week">Week (YYYY-Wnn)</SelectItem>
                  <SelectItem value="month">Month (YYYY-MM)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="periodValue">Period Value</Label>
              <input
                id="periodValue"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                value={formData.periodValue}
                onChange={(e) =>
                  setFormData({ ...formData, periodValue: e.target.value })
                }
                placeholder={
                  formData.periodType === "day"
                    ? "e.g., 2024-12-25"
                    : formData.periodType === "week"
                    ? "e.g., 2024-W52"
                    : "e.g., 2024-12"
                }
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              {selectedPeriod ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Disabled Period</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this disabled period? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPeriodToDelete(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
