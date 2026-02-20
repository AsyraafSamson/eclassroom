"use client";

import { useState, useEffect, useCallback, use } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, MoreHorizontal, Pencil, Trash2, School, Laptop2, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ClassroomDialog } from "@/components/classroom-dialog";
import { DeleteDialog } from "@/components/delete-dialog";

function ClassroomEquipmentSection({ classroomId }) {
  const [equipment, setEquipment] = useState([]);
  const [values, setValues] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchEquipment = useCallback(async () => {
    try {
      const res = await fetch(`/api/classrooms/${classroomId}/equipment`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const items = data.equipment || [];
      setEquipment(items);
      const vals = {};
      items.forEach((item) => {
        vals[item.id] = item.value ?? "";
      });
      setValues(vals);
    } catch (error) {
      toast.error("Failed to load equipment");
    } finally {
      setLoading(false);
    }
  }, [classroomId]);

  useEffect(() => {
    fetchEquipment();
  }, [fetchEquipment]);

  async function handleSave() {
    setSaving(true);
    try {
      const payload = equipment.map((item) => ({
        equipment_id: item.id,
        value: values[item.id] ?? "",
      }));
      const res = await fetch(`/api/classrooms/${classroomId}/equipment`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ equipment: payload }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Equipment saved");
    } catch (error) {
      toast.error(error?.message || "Failed to save equipment");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-full" />
        ))}
      </div>
    );
  }

  if (equipment.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-lg border py-8 text-center">
        <Laptop2 className="h-5 w-5 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          No equipment defined.{" "}
          <Link href="/dashboard/admin/equipment" className="text-primary underline">
            Add equipment
          </Link>{" "}
          first.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="space-y-3 rounded-lg border p-4">
        {equipment.map((item) => (
          <div key={item.id} className="flex items-center gap-3">
            <Label className="w-32 shrink-0 text-sm font-medium">
              {item.name}
            </Label>
            {item.type === "CHECKBOX" && (
              <Checkbox
                checked={values[item.id] === "1" || values[item.id] === "true"}
                onCheckedChange={(checked) =>
                  setValues({ ...values, [item.id]: checked ? "1" : "" })
                }
              />
            )}
            {item.type === "TEXT" && (
              <Input
                value={values[item.id] || ""}
                onChange={(e) =>
                  setValues({ ...values, [item.id]: e.target.value })
                }
                className="max-w-xs"
                placeholder="Enter value..."
              />
            )}
            {item.type === "SELECT" && (
              <Select
                value={values[item.id] || ""}
                onValueChange={(v) =>
                  setValues({ ...values, [item.id]: v === "__none__" ? "" : v })
                }
              >
                <SelectTrigger className="max-w-xs">
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {(item.options || "")
                    .split("\n")
                    .map((opt) => opt.trim())
                    .filter(Boolean)
                    .map((opt) => (
                      <SelectItem key={opt} value={opt}>
                        {opt}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            )}
          </div>
        ))}
      </div>
      <Button onClick={handleSave} disabled={saving} size="sm">
        <Save className="mr-2 h-4 w-4" />
        {saving ? "Saving..." : "Save Equipment"}
      </Button>
    </div>
  );
}

export default function RoomGroupDetailPage({ params }) {
  const { id: groupId } = use(params);

  const [group, setGroup] = useState(null);
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);

  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedClassroom, setSelectedClassroom] = useState(null);
  const [equipmentClassroomId, setEquipmentClassroomId] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const [groupsRes, classroomsRes] = await Promise.all([
        fetch("/api/room-groups").then((r) => r.json()),
        fetch(`/api/classrooms?groupId=${groupId}`).then((r) => r.json()),
      ]);

      const groups = groupsRes.roomGroups || [];
      const found = groups.find((g) => String(g.id) === String(groupId));
      setGroup(found || null);
      setClassrooms(classroomsRes.classrooms || []);
    } catch (error) {
      toast.error("Failed to load room group data");
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function handleCreateSuccess(classroom) {
    setClassrooms((prev) =>
      [...prev, classroom].sort((a, b) => a.name.localeCompare(b.name))
    );
    toast.success(`Classroom "${classroom.name}" created`);
  }

  function handleEditSuccess(classroom) {
    if (classroom.group_id !== parseInt(groupId, 10)) {
      setClassrooms((prev) => prev.filter((c) => c.id !== classroom.id));
      toast.success(`Classroom "${classroom.name}" updated and moved to another group`);
    } else {
      setClassrooms((prev) =>
        prev
          .map((c) => (c.id === classroom.id ? classroom : c))
          .sort((a, b) => a.name.localeCompare(b.name))
      );
      toast.success(`Classroom "${classroom.name}" updated`);
    }
  }

  function handleDeleteSuccess(classroom) {
    setClassrooms((prev) => prev.filter((c) => c.id !== classroom.id));
    toast.success(`Classroom "${classroom.name}" deleted`);
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-9 w-32" />
        <div className="flex items-center justify-between gap-4">
          <Skeleton className="h-7 w-60" />
          <Skeleton className="h-9 w-36" />
        </div>
        <div className="rounded-lg border">
          <div className="space-y-2 p-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-8 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="space-y-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/admin/rooms">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Groups
          </Link>
        </Button>
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border py-12 text-center">
          <p className="font-medium">Room group not found</p>
          <p className="text-sm text-muted-foreground">
            This room group may have been deleted.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Button variant="outline" size="sm" asChild>
        <Link href="/dashboard/admin/rooms">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Groups
        </Link>
      </Button>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-semibold font-[var(--font-display)]">
              {group.name}
            </h2>
            <Badge variant="secondary">
              {classrooms.length} room{classrooms.length === 1 ? "" : "s"}
            </Badge>
          </div>
          {group.description && (
            <p className="text-sm text-muted-foreground">
              {group.description}
            </p>
          )}
        </div>
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Room
        </Button>
      </div>

      {classrooms.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border py-12 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
            <School className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <p className="font-medium">No rooms in this group</p>
            <p className="text-sm text-muted-foreground">
              Add your first room to this group.
            </p>
          </div>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => setAddOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add your first room
          </Button>
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableCaption>
              Showing {classrooms.length} room
              {classrooms.length === 1 ? "" : "s"} in {group.name}
            </TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Capacity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Bookable</TableHead>
                <TableHead className="w-[70px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {classrooms.map((classroom) => (
                <TableRow key={classroom.id}>
                  <TableCell className="font-medium">
                    {classroom.name}
                  </TableCell>
                  <TableCell
                    className={
                      !classroom.location ? "text-muted-foreground" : ""
                    }
                  >
                    {classroom.location || "\u2014"}
                  </TableCell>
                  <TableCell
                    className={
                      classroom.capacity === null
                        ? "text-muted-foreground"
                        : ""
                    }
                  >
                    {classroom.capacity ?? "\u2014"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        classroom.status === "available"
                          ? "default"
                          : "secondary"
                      }
                      className="capitalize"
                    >
                      {classroom.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        classroom.can_be_booked ? "default" : "secondary"
                      }
                    >
                      {classroom.can_be_booked ? "Yes" : "No"}
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
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedClassroom(classroom);
                            setEditOpen(true);
                          }}
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setEquipmentClassroomId(
                              equipmentClassroomId === classroom.id
                                ? null
                                : classroom.id
                            );
                          }}
                        >
                          <Laptop2 className="mr-2 h-4 w-4" />
                          Equipment
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => {
                            setSelectedClassroom(classroom);
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

      {/* Equipment Section */}
      {equipmentClassroomId && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Laptop2 className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-lg font-semibold">
              Equipment &mdash;{" "}
              {classrooms.find((c) => c.id === equipmentClassroomId)?.name}
            </h3>
          </div>
          <ClassroomEquipmentSection classroomId={equipmentClassroomId} />
        </div>
      )}

      <ClassroomDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        classroom={null}
        defaultGroupId={groupId}
        onSuccess={handleCreateSuccess}
      />

      <ClassroomDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        classroom={selectedClassroom}
        onSuccess={handleEditSuccess}
      />

      <DeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Classroom"
        description={`Are you sure you want to delete "${selectedClassroom?.name}"? This action cannot be undone.`}
        apiUrl={selectedClassroom ? `/api/classrooms/${selectedClassroom.id}` : null}
        onSuccess={() => handleDeleteSuccess(selectedClassroom)}
      />
    </div>
  );
}
