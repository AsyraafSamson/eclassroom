"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, MoreHorizontal, Pencil, Trash2, Laptop2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

function EquipmentDialog({ open, onOpenChange, equipment, classrooms, onSuccess }) {
  const isEdit = !!equipment;
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", classroomId: "" });

  useEffect(() => {
    if (equipment) {
      setForm({
        name: equipment.name || "",
        description: equipment.description || "",
        classroomId: equipment.classroom_id ? String(equipment.classroom_id) : "",
      });
    } else {
      setForm({ name: "", description: "", classroomId: "" });
    }
  }, [equipment, open]);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const url = isEdit ? `/api/equipment/${equipment.id}` : "/api/equipment";
      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          description: form.description || null,
          classroomId: form.classroomId ? parseInt(form.classroomId, 10) : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onSuccess?.(data.equipment);
      onOpenChange(false);
    } catch (error) {
      toast.error(error?.message || "Failed to save equipment");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Equipment" : "Add Equipment"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Update equipment details." : "Add new equipment to track."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="eqName">Name *</Label>
            <Input
              id="eqName"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Projector"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="eqDesc">Description</Label>
            <Textarea
              id="eqDesc"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Optional description..."
              rows={2}
            />
          </div>
          <div className="space-y-2">
            <Label>Assigned Classroom</Label>
            <Select
              value={form.classroomId}
              onValueChange={(v) => setForm({ ...form, classroomId: v === "none" ? "" : v })}
            >
              <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {classrooms.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : isEdit ? "Save Changes" : "Add Equipment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function EquipmentPage() {
  const [equipment, setEquipment] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  const fetchEquipment = useCallback(async () => {
    try {
      const res = await fetch("/api/equipment");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setEquipment(data.equipment || []);
    } catch (error) {
      toast.error(error?.message || "Failed to load equipment");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEquipment();
    fetch("/api/classrooms").then((r) => r.json())
      .then((data) => setClassrooms(data.classrooms || []))
      .catch(() => {});
  }, [fetchEquipment]);

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
            <h2 className="text-2xl font-semibold font-[var(--font-display)]">Equipment</h2>
            <Badge variant="secondary">{equipment.length}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">Track room equipment and inventory</p>
        </div>
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />Add Equipment
        </Button>
      </div>

      {equipment.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border py-12 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
            <Laptop2 className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="font-medium">No equipment yet</p>
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Classroom</TableHead>
                <TableHead className="w-[70px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {equipment.map((eq) => (
                <TableRow key={eq.id}>
                  <TableCell className="font-medium">{eq.name}</TableCell>
                  <TableCell className={!eq.description ? "text-muted-foreground" : ""}>
                    {eq.description || "—"}
                  </TableCell>
                  <TableCell className={!eq.classroom_name ? "text-muted-foreground" : ""}>
                    {eq.classroom_name || "Unassigned"}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => { setSelected(eq); setEditOpen(true); }}>
                          <Pencil className="mr-2 h-4 w-4" />Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => { setSelected(eq); setDeleteOpen(true); }}>
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

      <EquipmentDialog open={addOpen} onOpenChange={setAddOpen} equipment={null} classrooms={classrooms} onSuccess={() => { toast.success("Equipment added"); fetchEquipment(); }} />
      <EquipmentDialog open={editOpen} onOpenChange={setEditOpen} equipment={selected} classrooms={classrooms} onSuccess={() => { toast.success("Equipment updated"); fetchEquipment(); }} />
      <DeleteDialog open={deleteOpen} onOpenChange={setDeleteOpen} title="Delete Equipment" description={`Delete "${selected?.name}"?`} apiUrl={selected ? `/api/equipment/${selected.id}` : null} onSuccess={() => { toast.success("Equipment deleted"); fetchEquipment(); }} />
    </div>
  );
}
