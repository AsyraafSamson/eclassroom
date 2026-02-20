"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  FolderOpen,
  Building2,
  AlertCircle,
} from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function AdminRoomsPage() {
  const [roomGroups, setRoomGroups] = useState([]);
  const [unassignedCount, setUnassignedCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const [form, setForm] = useState({ name: "", description: "" });

  const fetchData = useCallback(async () => {
    try {
      const [groupsRes, classroomsRes] = await Promise.all([
        fetch("/api/room-groups").then((r) => r.json()),
        fetch("/api/classrooms").then((r) => r.json()),
      ]);

      setRoomGroups(groupsRes.roomGroups || []);

      const classrooms = classroomsRes.classrooms || [];
      setUnassignedCount(classrooms.filter((c) => !c.group_id).length);
    } catch (error) {
      toast.error("Failed to load room groups");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function handleOpenAdd() {
    setForm({ name: "", description: "" });
    setAddOpen(true);
  }

  function handleOpenEdit(group) {
    setSelectedGroup(group);
    setForm({ name: group.name, description: group.description || "" });
    setEditOpen(true);
  }

  async function handleCreate(e) {
    e.preventDefault();
    setActionLoading(true);

    try {
      const res = await fetch("/api/room-groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create room group");
      }

      const newGroup = { ...data.roomGroup, room_count: 0 };
      setRoomGroups((prev) =>
        [...prev, newGroup].sort((a, b) => a.name.localeCompare(b.name))
      );
      toast.success(`Room group "${data.roomGroup.name}" created`);
      setAddOpen(false);
    } catch (error) {
      toast.error(error?.message || "Failed to create room group");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleUpdate(e) {
    e.preventDefault();
    if (!selectedGroup) return;
    setActionLoading(true);

    try {
      const res = await fetch(`/api/room-groups/${selectedGroup.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update room group");
      }

      setRoomGroups((prev) =>
        prev
          .map((g) =>
            g.id === selectedGroup.id
              ? { ...data.roomGroup, room_count: g.room_count }
              : g
          )
          .sort((a, b) => a.name.localeCompare(b.name))
      );
      toast.success(`Room group "${data.roomGroup.name}" updated`);
      setEditOpen(false);
    } catch (error) {
      toast.error(error?.message || "Failed to update room group");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDelete() {
    if (!selectedGroup) return;
    setActionLoading(true);

    try {
      const res = await fetch(`/api/room-groups/${selectedGroup.id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to delete room group");
      }

      const deletedGroup = selectedGroup;
      setRoomGroups((prev) => prev.filter((g) => g.id !== deletedGroup.id));
      setUnassignedCount((prev) => prev + (deletedGroup.room_count || 0));
      toast.success(`Room group "${deletedGroup.name}" deleted`);
      setDeleteOpen(false);
    } catch (error) {
      toast.error(error?.message || "Failed to delete room group");
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-7 w-40" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-9 w-40" />
        </div>
        <div className="rounded-lg border">
          <div className="space-y-2 p-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-12 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-semibold font-[var(--font-display)]">
              Room Groups
            </h2>
            <Badge variant="secondary">{roomGroups.length}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Organize classrooms into groups for easier management
          </p>
        </div>
        <Button onClick={handleOpenAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Add Group
        </Button>
      </div>

      {unassignedCount > 0 && (
        <Link
          href="/dashboard/admin/rooms/unassigned"
          className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 transition hover:bg-amber-100"
        >
          <AlertCircle className="h-4 w-4" />
          <span className="font-medium">
            {unassignedCount} unassigned room{unassignedCount === 1 ? "" : "s"}
          </span>
          <span className="text-amber-600">— Click to manage</span>
        </Link>
      )}

      {roomGroups.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border py-12 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
            <FolderOpen className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <p className="font-medium">No room groups yet</p>
            <p className="text-sm text-muted-foreground">
              Create your first room group to organize classrooms.
            </p>
          </div>
          <Button variant="outline" className="mt-4" onClick={handleOpenAdd}>
            <Plus className="mr-2 h-4 w-4" />
            Add your first room group
          </Button>
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableCaption>
              Showing {roomGroups.length} room group
              {roomGroups.length === 1 ? "" : "s"}
            </TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Rooms</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="w-[70px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roomGroups.map((group) => (
                <TableRow key={group.id}>
                  <TableCell className="font-medium">
                    <Link
                      href={`/dashboard/admin/rooms/${group.id}`}
                      className="text-primary underline-offset-4 hover:underline"
                    >
                      {group.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{group.room_count}</Badge>
                  </TableCell>
                  <TableCell
                    className={
                      !group.description ? "text-muted-foreground" : ""
                    }
                  >
                    {group.description || "\u2014"}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/admin/rooms/${group.id}`}>
                            <Building2 className="mr-2 h-4 w-4" />
                            View Rooms
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleOpenEdit(group)}
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => {
                            setSelectedGroup(group);
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

      {/* Add Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Add Room Group</DialogTitle>
            <DialogDescription>
              Create a new room group to organize classrooms.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="add-name">Name *</Label>
              <Input
                id="add-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Computer Labs"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-description">Description</Label>
              <Textarea
                id="add-description"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="Optional description"
                rows={3}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={actionLoading}>
                {actionLoading ? "Creating..." : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Edit Room Group</DialogTitle>
            <DialogDescription>
              Update the room group details.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name *</Label>
              <Input
                id="edit-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Computer Labs"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="Optional description"
                rows={3}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={actionLoading}>
                {actionLoading ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Room Group</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-semibold">{selectedGroup?.name}</span>?
              Classrooms in this group will not be deleted but will become
              ungrouped.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={actionLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {actionLoading ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
