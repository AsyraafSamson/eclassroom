"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, MoreHorizontal, Pencil, Trash2, School } from "lucide-react";
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
import { DeleteDialog } from "@/components/delete-dialog";

export default function UnassignedRoomsPage() {
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);

  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedClassroom, setSelectedClassroom] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/classrooms");
      const data = await res.json();
      const all = data.classrooms || [];
      setClassrooms(all.filter((c) => !c.group_id));
    } catch (error) {
      toast.error("Failed to load classrooms");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function handleEditSuccess(classroom) {
    if (classroom.group_id) {
      setClassrooms((prev) => prev.filter((c) => c.id !== classroom.id));
      toast.success(`"${classroom.name}" assigned to a group`);
    } else {
      setClassrooms((prev) =>
        prev
          .map((c) => (c.id === classroom.id ? classroom : c))
          .sort((a, b) => a.name.localeCompare(b.name))
      );
      toast.success(`"${classroom.name}" updated`);
    }
  }

  function handleDeleteSuccess(classroom) {
    setClassrooms((prev) => prev.filter((c) => c.id !== classroom.id));
    toast.success(`"${classroom.name}" deleted`);
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-7 w-60" />
        <div className="rounded-lg border">
          <div className="space-y-2 p-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
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

      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-semibold font-[var(--font-display)]">
            Unassigned Rooms
          </h2>
          <Badge variant="secondary">{classrooms.length}</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          These rooms are not assigned to any group. Edit them to assign a group.
        </p>
      </div>

      {classrooms.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border py-12 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
            <School className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="font-medium">No unassigned rooms</p>
          <p className="text-sm text-muted-foreground">
            All rooms are assigned to a group.
          </p>
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableCaption>
              Showing {classrooms.length} unassigned room
              {classrooms.length === 1 ? "" : "s"}
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
