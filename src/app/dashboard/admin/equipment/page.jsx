"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, MoreHorizontal, Pencil, Trash2, Laptop2, Grid3X3, List, Save, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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

const EQUIPMENT_TYPES = [
  { value: "CHECKBOX", label: "Checkbox" },
  { value: "TEXT", label: "Text" },
  { value: "SELECT", label: "Select" },
];

function EquipmentDialog({ open, onOpenChange, equipment, onSuccess }) {
  const isEdit = !!equipment;
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", type: "CHECKBOX", options: "" });

  useEffect(() => {
    if (equipment) {
      setForm({
        name: equipment.name || "",
        type: equipment.type || "CHECKBOX",
        options: equipment.options || "",
      });
    } else {
      setForm({ name: "", type: "CHECKBOX", options: "" });
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
          type: form.type,
          options: form.type === "SELECT" ? form.options || null : null,
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
            <Label>Type</Label>
            <div className="flex gap-2">
              {EQUIPMENT_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setForm({ ...form, type: t.value })}
                  className={`rounded-md border px-3 py-1.5 text-sm font-medium transition ${
                    form.type === t.value
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background text-foreground hover:bg-muted"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          {form.type === "SELECT" && (
            <div className="space-y-2">
              <Label htmlFor="eqOptions">Options</Label>
              <Textarea
                id="eqOptions"
                value={form.options}
                onChange={(e) => setForm({ ...form, options: e.target.value })}
                placeholder="Enter one option per line"
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                Enter one option per line. These will appear as dropdown choices.
              </p>
            </div>
          )}
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

function TypeBadge({ type }) {
  const variants = {
    CHECKBOX: "default",
    TEXT: "secondary",
    SELECT: "outline",
  };
  return (
    <Badge variant={variants[type] || "secondary"} className="capitalize">
      {type?.toLowerCase() || "checkbox"}
    </Badge>
  );
}

// ── Matrix Grid View ──────────────────────────────────────────────
function AssignmentMatrix() {
  const [classrooms, setClassrooms] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [values, setValues] = useState({}); // key: "classroomId-equipmentId" → value
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/equipment/assign");
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setClassrooms(data.classrooms || []);
        setEquipment(data.equipment || []);
        const vals = {};
        (data.assignments || []).forEach((a) => {
          vals[`${a.classroom_id}-${a.equipment_id}`] = a.value;
        });
        setValues(vals);
      } catch (error) {
        toast.error("Failed to load assignment data");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  function getKey(cId, eId) {
    return `${cId}-${eId}`;
  }

  function setValue(cId, eId, val) {
    setValues((prev) => ({ ...prev, [getKey(cId, eId)]: val }));
  }

  function toggleCheckbox(cId, eId) {
    const key = getKey(cId, eId);
    setValues((prev) => ({
      ...prev,
      [key]: prev[key] === "1" ? "" : "1",
    }));
  }

  function tickAll() {
    const checkboxEquipment = equipment.filter((e) => e.type === "CHECKBOX");
    const allChecked = classrooms.every((c) =>
      checkboxEquipment.every((e) => values[getKey(c.id, e.id)] === "1")
    );
    const newVal = allChecked ? "" : "1";
    setValues((prev) => {
      const next = { ...prev };
      classrooms.forEach((c) => {
        checkboxEquipment.forEach((e) => {
          next[getKey(c.id, e.id)] = newVal;
        });
      });
      return next;
    });
  }

  function toggleColumn(eId) {
    const allChecked = classrooms.every((c) => values[getKey(c.id, eId)] === "1");
    const newVal = allChecked ? "" : "1";
    setValues((prev) => {
      const next = { ...prev };
      classrooms.forEach((c) => {
        next[getKey(c.id, eId)] = newVal;
      });
      return next;
    });
  }

  function toggleRow(cId) {
    const checkboxEquipment = equipment.filter((e) => e.type === "CHECKBOX");
    const allChecked = checkboxEquipment.every((e) => values[getKey(cId, e.id)] === "1");
    const newVal = allChecked ? "" : "1";
    setValues((prev) => {
      const next = { ...prev };
      checkboxEquipment.forEach((e) => {
        next[getKey(cId, e.id)] = newVal;
      });
      return next;
    });
  }

  async function handleSave() {
    setSaving(true);
    try {
      const assignments = [];
      classrooms.forEach((c) => {
        equipment.forEach((e) => {
          const val = values[getKey(c.id, e.id)] || "";
          if (val) {
            assignments.push({
              classroom_id: c.id,
              equipment_id: e.id,
              value: val,
            });
          }
        });
      });
      const res = await fetch("/api/equipment/assign", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignments }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("All assignments saved");
    } catch (error) {
      toast.error(error?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-full" />
        ))}
      </div>
    );
  }

  if (classrooms.length === 0 || equipment.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-lg border py-12 text-center">
        <Laptop2 className="h-5 w-5 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          {classrooms.length === 0
            ? "No classrooms found. Add classrooms first."
            : "No equipment defined. Add equipment first."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={tickAll}>
          <Check className="mr-2 h-4 w-4" />
          {classrooms.every((c) =>
            equipment.filter((e) => e.type === "CHECKBOX").every((e) => values[getKey(c.id, e.id)] === "1")
          )
            ? "Untick All"
            : "Tick All"}
        </Button>
      </div>
      <div className="rounded-lg border">
        <div className="overflow-x-auto">
          <table className="w-full border-separate border-spacing-0 text-sm">
            <thead>
              <tr>
                <th className="sticky left-0 z-[5] border-b bg-muted px-3 py-2 text-left font-semibold">
                  Classroom
                </th>
                {equipment.map((eq) => (
                  <th
                    key={eq.id}
                    className="border-b border-l bg-muted/60 px-2 py-2 text-center font-semibold whitespace-nowrap"
                  >
                    <div>{eq.name}</div>
                    {eq.type === "CHECKBOX" && (
                      <button
                        type="button"
                        onClick={() => toggleColumn(eq.id)}
                        className="mt-1 text-[0.6rem] text-primary hover:underline"
                      >
                        toggle all
                      </button>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {classrooms.map((classroom, rowIdx) => (
                <tr
                  key={classroom.id}
                  className={rowIdx % 2 ? "bg-muted/20" : "bg-background"}
                >
                  <td className={`sticky left-0 z-[5] border-b px-3 py-2 font-medium whitespace-nowrap ${rowIdx % 2 ? "bg-muted" : "bg-background"}`}>
                    <span className="flex items-center gap-2">
                      {classroom.name}
                      <button
                        type="button"
                        onClick={() => toggleRow(classroom.id)}
                        className="text-[0.6rem] text-primary hover:underline"
                      >
                        toggle
                      </button>
                    </span>
                  </td>
                  {equipment.map((eq) => {
                    const key = getKey(classroom.id, eq.id);
                    const val = values[key] || "";

                    return (
                      <td
                        key={eq.id}
                        className="border-b border-l px-2 py-2 text-center"
                      >
                        {eq.type === "CHECKBOX" ? (
                          <Checkbox
                            checked={val === "1"}
                            onCheckedChange={() => toggleCheckbox(classroom.id, eq.id)}
                          />
                        ) : eq.type === "TEXT" ? (
                          <Input
                            value={val}
                            onChange={(e) => setValue(classroom.id, eq.id, e.target.value)}
                            className="h-7 min-w-[80px] text-xs"
                            placeholder="..."
                          />
                        ) : eq.type === "SELECT" ? (
                          <Select
                            value={val || "__none__"}
                            onValueChange={(v) => setValue(classroom.id, eq.id, v === "__none__" ? "" : v)}
                          >
                            <SelectTrigger className="h-7 min-w-[80px] text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="__none__">—</SelectItem>
                              {(eq.options || "")
                                .split("\n")
                                .map((o) => o.trim())
                                .filter(Boolean)
                                .map((o) => (
                                  <SelectItem key={o} value={o}>{o}</SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        ) : null}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <Button onClick={handleSave} disabled={saving}>
        <Save className="mr-2 h-4 w-4" />
        {saving ? "Saving..." : "Save All Assignments"}
      </Button>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────
export default function EquipmentPage() {
  const [view, setView] = useState("list"); // "list" | "assign"
  const [equipment, setEquipment] = useState([]);
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
          <p className="text-sm text-muted-foreground">
            {view === "list"
              ? "Define equipment fields for classrooms"
              : "Assign equipment to classrooms in bulk"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-md border">
            <button
              type="button"
              onClick={() => setView("list")}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition ${
                view === "list"
                  ? "bg-primary text-primary-foreground"
                  : "bg-background text-foreground hover:bg-muted"
              } rounded-l-md`}
            >
              <List className="h-4 w-4" />
              List
            </button>
            <button
              type="button"
              onClick={() => setView("assign")}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition ${
                view === "assign"
                  ? "bg-primary text-primary-foreground"
                  : "bg-background text-foreground hover:bg-muted"
              } rounded-r-md`}
            >
              <Grid3X3 className="h-4 w-4" />
              Assign
            </button>
          </div>
          {view === "list" && (
            <Button onClick={() => setAddOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />Add Equipment
            </Button>
          )}
        </div>
      </div>

      {view === "assign" ? (
        <AssignmentMatrix />
      ) : equipment.length === 0 ? (
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
                <TableHead>Type</TableHead>
                <TableHead>Options</TableHead>
                <TableHead className="w-[70px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {equipment.map((eq) => (
                <TableRow key={eq.id}>
                  <TableCell className="font-medium">{eq.name}</TableCell>
                  <TableCell>
                    <TypeBadge type={eq.type} />
                  </TableCell>
                  <TableCell className={!eq.options ? "text-muted-foreground" : ""}>
                    {eq.type === "SELECT" && eq.options
                      ? eq.options.split("\n").filter(Boolean).join(", ")
                      : "\u2014"}
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

      <EquipmentDialog open={addOpen} onOpenChange={setAddOpen} equipment={null} onSuccess={() => { toast.success("Equipment added"); fetchEquipment(); }} />
      <EquipmentDialog open={editOpen} onOpenChange={setEditOpen} equipment={selected} onSuccess={() => { toast.success("Equipment updated"); fetchEquipment(); }} />
      <DeleteDialog open={deleteOpen} onOpenChange={setDeleteOpen} title="Delete Equipment" description={`Delete "${selected?.name}"?`} apiUrl={selected ? `/api/equipment/${selected.id}` : null} onSuccess={() => { toast.success("Equipment deleted"); fetchEquipment(); }} />
    </div>
  );
}
