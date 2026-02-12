"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, MoreHorizontal, Pencil, Trash2, Users } from "lucide-react";
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

function DepartmentDialog({ open, onOpenChange, department, onSuccess }) {
  const isEdit = !!department;
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");

  useEffect(() => {
    setName(department?.name || "");
  }, [department, open]);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const url = isEdit ? `/api/departments/${department.id}` : "/api/departments";
      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onSuccess?.(data.department);
      onOpenChange(false);
    } catch (error) {
      toast.error(error?.message || "Failed to save department");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Department" : "Add Department"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Update department name." : "Create a new department."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="deptName">Name *</Label>
            <Input
              id="deptName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Nursing"
              required
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : isEdit ? "Save Changes" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  const fetchDepts = useCallback(async () => {
    try {
      const res = await fetch("/api/departments");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setDepartments(data.departments || []);
    } catch (error) {
      toast.error(error?.message || "Failed to load departments");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDepts(); }, [fetchDepts]);

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
            <h2 className="text-2xl font-semibold font-[var(--font-display)]">Departments</h2>
            <Badge variant="secondary">{departments.length}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">Organize departments and teaching units</p>
        </div>
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />Add Department
        </Button>
      </div>

      {departments.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border py-12 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
            <Users className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="font-medium">No departments yet</p>
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="w-[70px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {departments.map((dept) => (
                <TableRow key={dept.id}>
                  <TableCell className="font-medium">{dept.name}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => { setSelected(dept); setEditOpen(true); }}>
                          <Pencil className="mr-2 h-4 w-4" />Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => { setSelected(dept); setDeleteOpen(true); }}>
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

      <DepartmentDialog open={addOpen} onOpenChange={setAddOpen} department={null} onSuccess={() => { toast.success("Department created"); fetchDepts(); }} />
      <DepartmentDialog open={editOpen} onOpenChange={setEditOpen} department={selected} onSuccess={() => { toast.success("Department updated"); fetchDepts(); }} />
      <DeleteDialog open={deleteOpen} onOpenChange={setDeleteOpen} title="Delete Department" description={`Delete "${selected?.name}"?`} apiUrl={selected ? `/api/departments/${selected.id}` : null} onSuccess={() => { toast.success("Department deleted"); fetchDepts(); }} />
    </div>
  );
}
