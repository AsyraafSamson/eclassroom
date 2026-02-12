"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Plus, MoreHorizontal, Pencil, Trash2, CircleUser, Search,
  ChevronLeft, ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserDialog } from "@/components/user-dialog";
import { DeleteDialog } from "@/components/delete-dialog";

export default function ManageUsersPage() {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 1 });

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const fetchUsers = useCallback(async (page = 1) => {
    try {
      const params = new URLSearchParams({ page: String(page) });
      if (search) params.set("search", search);
      if (roleFilter !== "all") params.set("role", roleFilter);

      const res = await fetch(`/api/users?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setUsers(data.users || []);
      setPagination(data.pagination || { page: 1, total: 0, totalPages: 1 });
    } catch (error) {
      toast.error(error?.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter]);

  useEffect(() => {
    fetch("/api/departments")
      .then((r) => r.json())
      .then((data) => setDepartments(data.departments || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchUsers(1);
  }, [fetchUsers]);

  function handleSearch(e) {
    e.preventDefault();
    setLoading(true);
    fetchUsers(1);
  }

  function handleCreateSuccess(newUser) {
    toast.success(`User "${newUser.full_name || newUser.email}" created`);
    fetchUsers(pagination.page);
  }

  function handleEditSuccess(updatedUser) {
    toast.success(`User "${updatedUser.full_name || updatedUser.email}" updated`);
    fetchUsers(pagination.page);
  }

  function handleDeleteSuccess() {
    toast.success(`User "${selectedUser?.full_name || selectedUser?.email}" deleted`);
    fetchUsers(pagination.page);
  }

  if (loading && users.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-9 w-32" />
        </div>
        <div className="rounded-lg border">
          <div className="space-y-2 p-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
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
              Manage Users
            </h2>
            <Badge variant="secondary">{pagination.total}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Create, edit, and manage user accounts
          </p>
        </div>
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add User
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-64 pl-9"
            />
          </div>
        </form>
        <Select
          value={roleFilter}
          onValueChange={(value) => setRoleFilter(value)}
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder="All Roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="user">User</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {users.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border py-12 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
            <CircleUser className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="font-medium">No users found</p>
          <p className="text-sm text-muted-foreground">
            {search || roleFilter !== "all"
              ? "Try adjusting your search or filter."
              : "Create your first user to get started."}
          </p>
        </div>
      ) : (
        <>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Username</TableHead>
                  <TableHead>Full Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead className="w-[70px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">
                      {u.username || <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell>{u.full_name || "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{u.email}</TableCell>
                    <TableCell>
                      <Badge variant={u.role === "admin" ? "default" : "secondary"} className="capitalize">
                        {u.role}
                      </Badge>
                    </TableCell>
                    <TableCell className={!u.department_name ? "text-muted-foreground" : ""}>
                      {u.department_name || "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {u.last_login
                        ? new Date(u.last_login + "Z").toLocaleDateString()
                        : "Never"}
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
                              setSelectedUser(u);
                              setEditOpen(true);
                            }}
                          >
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => {
                              setSelectedUser(u);
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

          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Page {pagination.page} of {pagination.totalPages} ({pagination.total} users)
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page <= 1}
                  onClick={() => fetchUsers(pagination.page - 1)}
                >
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => fetchUsers(pagination.page + 1)}
                >
                  Next
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      <UserDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        user={null}
        departments={departments}
        onSuccess={handleCreateSuccess}
      />

      <UserDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        user={selectedUser}
        departments={departments}
        onSuccess={handleEditSuccess}
      />

      <DeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete User"
        description={`Are you sure you want to delete "${selectedUser?.full_name || selectedUser?.email}"? All their bookings will also be removed. This action cannot be undone.`}
        apiUrl={selectedUser ? `/api/users/${selectedUser.id}` : null}
        onSuccess={handleDeleteSuccess}
      />
    </div>
  );
}
