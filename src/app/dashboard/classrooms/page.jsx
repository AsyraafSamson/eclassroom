"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, MoreHorizontal, Pencil, Trash2, School } from "lucide-react";
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
import { ClassroomDialog } from "@/components/classroom-dialog";
import { DeleteClassroomDialog } from "@/components/delete-classroom-dialog";
import { BookingGrid } from "@/components/booking-grid";

export default function ClassroomsPage() {
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  // Dialog states
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedClassroom, setSelectedClassroom] = useState(null);

  const fetchClassrooms = useCallback(async () => {
    try {
      const res = await fetch("/api/classrooms");
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to load classrooms");
      }
      setClassrooms(data.classrooms || []);
    } catch (error) {
      toast.error(error?.message || "Failed to load classrooms");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClassrooms();
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => setUser(data.user))
      .catch(() => {});
  }, [fetchClassrooms]);

  const isAdmin = user?.role === "admin";

  function handleCreateSuccess(classroom) {
    setClassrooms((prev) => [...prev, classroom].sort((a, b) => a.name.localeCompare(b.name)));
    toast.success(`Classroom "${classroom.name}" created successfully`);
  }

  function handleEditSuccess(classroom) {
    setClassrooms((prev) =>
      prev
        .map((c) => (c.id === classroom.id ? classroom : c))
        .sort((a, b) => a.name.localeCompare(b.name))
    );
    toast.success(`Classroom "${classroom.name}" updated successfully`);
  }

  function handleDeleteSuccess(classroom) {
    setClassrooms((prev) => prev.filter((c) => c.id !== classroom.id));
    toast.success(`Classroom "${classroom.name}" deleted successfully`);
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-7 w-40" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-9 w-32" />
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

  if (!isAdmin) {
    return <BookingGrid />;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-semibold font-[var(--font-display)]">
              Classrooms
            </h2>
            <Badge variant="secondary">{classrooms.length}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Manage classroom details and availability
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Classroom
          </Button>
        )}
      </div>

      {classrooms.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border py-12 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
            <School className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <p className="font-medium">No classrooms yet</p>
            <p className="text-sm text-muted-foreground">
              Create your first classroom to get started.
            </p>
          </div>
          {isAdmin && (
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => setAddOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add your first classroom
            </Button>
          )}
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableCaption>
              Showing {classrooms.length} classroom
              {classrooms.length === 1 ? "" : "s"}
            </TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Capacity</TableHead>
                <TableHead>Status</TableHead>
                {isAdmin && (
                  <TableHead className="w-[70px]">Actions</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {classrooms.map((classroom) => (
                <TableRow key={classroom.id}>
                  <TableCell className="font-medium">
                    {classroom.name}
                  </TableCell>
                  <TableCell className={!classroom.location ? "text-muted-foreground" : ""}>
                    {classroom.location || "—"}
                  </TableCell>
                  <TableCell className={classroom.capacity === null ? "text-muted-foreground" : ""}>
                    {classroom.capacity ?? "—"}
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
                  {isAdmin && (
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
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Add Dialog */}
      <ClassroomDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        classroom={null}
        onSuccess={handleCreateSuccess}
      />

      {/* Edit Dialog */}
      <ClassroomDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        classroom={selectedClassroom}
        onSuccess={handleEditSuccess}
      />

      {/* Delete Dialog */}
      <DeleteClassroomDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        classroom={selectedClassroom}
        onSuccess={handleDeleteSuccess}
      />

    </div>
  );
}
