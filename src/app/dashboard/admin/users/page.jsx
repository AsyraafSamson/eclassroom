"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Plus, MoreHorizontal, Pencil, Trash2, CircleUser, Search,
  ChevronLeft, ChevronRight, Upload, Download, Printer, FileDown,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { UserDialog } from "@/components/user-dialog";
import { DeleteDialog } from "@/components/delete-dialog";

function parseCsv(text) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());

  return lines.slice(1).map((line) => {
    const values = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (inQuotes) {
        if (ch === '"' && line[i + 1] === '"') {
          current += '"';
          i++;
        } else if (ch === '"') {
          inQuotes = false;
        } else {
          current += ch;
        }
      } else if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        values.push(current.trim());
        current = "";
      } else {
        current += ch;
      }
    }
    values.push(current.trim());

    const row = {};
    headers.forEach((h, i) => {
      row[h] = values[i] || "";
    });
    return row;
  });
}

export default function ManageUsersPage() {
  const [users, setUsers] = useState([]);
  const [printUsers, setPrintUsers] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 1 });

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Batch add state
  const [batchOpen, setBatchOpen] = useState(false);
  const [batchPreview, setBatchPreview] = useState([]);
  const [batchLoading, setBatchLoading] = useState(false);
  const fileInputRef = useRef(null);

  // Batch delete state
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [allAcrossPages, setAllAcrossPages] = useState(false);
  const [batchDeleteOpen, setBatchDeleteOpen] = useState(false);
  const [batchDeleteLoading, setBatchDeleteLoading] = useState(false);

  // We need current user ID to disable self-selection
  const [currentUserId, setCurrentUserId] = useState(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.user?.id) setCurrentUserId(data.user.id);
        else if (data.id) setCurrentUserId(data.id);
      })
      .catch(() => {});
  }, []);

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

  // Clear selections when search/filter changes (but NOT page changes)
  useEffect(() => {
    setSelectedIds(new Set());
    setAllAcrossPages(false);
  }, [search, roleFilter]);

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

  // --- Batch Add ---
  function handleFileSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const rows = parseCsv(ev.target.result);
      if (rows.length === 0) {
        toast.error("No valid rows found in CSV");
        return;
      }
      setBatchPreview(rows);
      setBatchOpen(true);
    };
    reader.readAsText(file);
    // Reset so same file can be re-selected
    e.target.value = "";
  }

  async function handleBatchUpload() {
    if (batchPreview.length === 0) return;
    setBatchLoading(true);
    try {
      const res = await fetch("/api/users/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ users: batchPreview }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success(`Created ${data.created} user(s), skipped ${data.skipped}`);
      setBatchOpen(false);
      setBatchPreview([]);
      fetchUsers(1);
    } catch (error) {
      toast.error(error?.message || "Batch upload failed");
    } finally {
      setBatchLoading(false);
    }
  }

  function downloadTemplate() {
    const csv = "username,password,email,full_name,role\njohn,john@123456,john@ilkkm.edu.my,John Doe,user\n";
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "users_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  // --- Export ---
  function handleExportCsv() {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (roleFilter !== "all") params.set("role", roleFilter);
    window.open(`/api/users/export?${params}`, "_blank");
  }

  async function handlePrint() {
    try {
      // Fetch all users for printing
      const params = new URLSearchParams({ all: "true" });
      if (search) params.set("search", search);
      if (roleFilter !== "all") params.set("role", roleFilter);

      const res = await fetch(`/api/users?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setPrintUsers(data.users || []);
      
      // Wait for state to update and DOM to render, then print
      setTimeout(() => {
        window.print();
        // Clear print users after printing
        setTimeout(() => setPrintUsers(null), 100);
      }, 100);
    } catch (error) {
      toast.error("Failed to load users for printing");
    }
  }

  // --- Batch Delete ---
  function toggleSelect(id) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        setAllAcrossPages(false);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  async function toggleSelectAll() {
    if (allAcrossPages) {
      // Deselect all
      setSelectedIds(new Set());
      setAllAcrossPages(false);
      return;
    }

    // Fetch ALL selectable user IDs from the server (across all pages)
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (roleFilter !== "all") params.set("role", roleFilter);

      const res = await fetch(`/api/users/all-ids?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setSelectedIds(new Set(data.ids));
      setAllAcrossPages(true);
    } catch (error) {
      toast.error("Failed to select all users");
    }
  }

  async function handleBatchDelete() {
    if (selectedIds.size === 0) return;
    setBatchDeleteLoading(true);
    try {
      const res = await fetch("/api/users/batch-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userIds: Array.from(selectedIds) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success(`Deleted ${data.deleted} user(s)`);
      setBatchDeleteOpen(false);
      setSelectedIds(new Set());
      setAllAcrossPages(false);
      fetchUsers(1);
    } catch (error) {
      toast.error(error?.message || "Batch delete failed");
    } finally {
      setBatchDeleteLoading(false);
    }
  }

  const selectableUsers = users.filter((u) => u.id !== currentUserId);
  const allSelected = allAcrossPages ||
    (selectableUsers.length > 0 &&
    selectableUsers.every((u) => selectedIds.has(u.id)));

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
    <>
      {/* Print-only styles */}
      <style jsx global>{`
        @media print {
          /* Reset everything for clean print */
          html, body {
            background: white !important;
            color: black !important;
            font-size: 11px !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          body * { 
            visibility: hidden; 
          }
          
          /* Show only the table */
          #print-table, #print-table * { 
            visibility: visible; 
          }
          
          #print-table { 
            position: absolute; 
            left: 0; 
            top: 0; 
            width: 100%; 
            padding: 20px;
            margin: 0;
          }
          
          /* Hide interactive elements */
          .no-print { 
            display: none !important; 
          }
          
          /* Print header */
          #print-table::before {
            content: "User Management Report";
            display: block;
            font-size: 18px;
            font-weight: 700;
            text-align: center;
            padding-bottom: 12px;
            margin-bottom: 16px;
            border-bottom: 2px solid #333;
          }
          
          /* Table container styling */
          #print-table .rounded-lg.border {
            border: 1px solid #ddd !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            background: white !important;
          }
          
          /* Table styling */
          #print-table table {
            width: 100% !important;
            border-collapse: collapse !important;
            font-size: 10px !important;
          }
          
          #print-table th {
            background: #f5f5f5 !important;
            font-weight: 600 !important;
            text-align: left !important;
            padding: 8px 6px !important;
            border-bottom: 2px solid #333 !important;
            color: black !important;
          }
          
          #print-table td {
            padding: 6px !important;
            border-bottom: 1px solid #e5e5e5 !important;
            color: black !important;
          }
          
          /* Badge styling for print */
          #print-table [data-slot="badge"] {
            border: 1px solid #999 !important;
            background: #f5f5f5 !important;
            color: black !important;
            padding: 2px 6px !important;
            border-radius: 3px !important;
            font-size: 9px !important;
            font-weight: 500 !important;
          }
          
          /* Admin badge - darker for print */
          #print-table [data-slot="badge"][data-variant="default"] {
            background: #e5e5e5 !important;
            border-color: #666 !important;
          }
          
          /* Force black text for all content */
          #print-table .text-muted-foreground {
            color: #555 !important;
          }
          
          #print-table .font-medium {
            font-weight: 600 !important;
          }
          
          /* Ensure proper row spacing */
          #print-table tbody tr {
            break-inside: avoid;
          }
          
          /* Date formatting */
          #print-table .text-xs {
            font-size: 9px !important;
          }
        }
      `}</style>

      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 no-print">
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
          <div className="flex flex-wrap items-center gap-2">
            {selectedIds.size > 0 && (
              <Button
                variant="destructive"
                onClick={() => setBatchDeleteOpen(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete ({selectedIds.size})
              </Button>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <FileDown className="mr-2 h-4 w-4" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleExportCsv}>
                  <Download className="mr-2 h-4 w-4" />
                  Download CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handlePrint}>
                  <Printer className="mr-2 h-4 w-4" />
                  Print
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="mr-2 h-4 w-4" />
              Batch Add
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleFileSelect}
            />

            <Button onClick={() => setAddOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add User
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 no-print">
          <form onSubmit={handleSearch} className="flex flex-1 items-center gap-2">
            <div className="relative flex-1 sm:flex-none">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 sm:w-64"
              />
            </div>
          </form>
          <Select
            value={roleFilter}
            onValueChange={(value) => setRoleFilter(value)}
          >
            <SelectTrigger className="w-32 sm:w-36">
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
            {selectedIds.size > 0 && (
              <div className="rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950 p-3 text-sm no-print">
                {allAcrossPages ? (
                  <span>
                    All <strong>{selectedIds.size}</strong> users across all pages are selected.{" "}
                    <button
                      className="text-blue-600 dark:text-blue-400 underline hover:no-underline"
                      onClick={() => { setSelectedIds(new Set()); setAllAcrossPages(false); }}
                    >
                      Clear selection
                    </button>
                  </span>
                ) : (
                  <span>
                    <strong>{selectedIds.size}</strong> user(s) selected on this page.{" "}
                    <button
                      className="text-blue-600 dark:text-blue-400 underline hover:no-underline"
                      onClick={toggleSelectAll}
                    >
                      Select all {pagination.total > 1 ? `${pagination.total - 1} users` : "users"} across all pages
                    </button>
                  </span>
                )}
              </div>
            )}

            <div className="rounded-lg border overflow-x-auto" id="print-table">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40px] no-print">
                      <Checkbox
                        checked={allSelected}
                        onCheckedChange={toggleSelectAll}
                        aria-label="Select all"
                      />
                    </TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Full Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead className="w-[70px] no-print">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(printUsers || users).map((u) => (
                    <TableRow
                      key={u.id}
                      data-state={selectedIds.has(u.id) ? "selected" : undefined}
                    >
                      <TableCell className="no-print">
                        <Checkbox
                          checked={selectedIds.has(u.id)}
                          onCheckedChange={() => toggleSelect(u.id)}
                          disabled={u.id === currentUserId}
                          aria-label={`Select ${u.username || u.email}`}
                        />
                      </TableCell>
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
                      <TableCell className="no-print">
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
              <div className="flex items-center justify-between no-print">
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

        {/* Existing dialogs */}
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

        {/* Batch Add Dialog */}
        <Dialog open={batchOpen} onOpenChange={setBatchOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[80vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>Batch Add Users</DialogTitle>
              <DialogDescription>
                Upload a CSV file with columns: username, password, email, full_name, role.
                Password defaults to username@123456, email to username@ilkkm.edu.my, role to user.
              </DialogDescription>
            </DialogHeader>
            <div className="flex-1 overflow-auto">
              {batchPreview.length > 0 && (
                <div className="rounded-lg border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>#</TableHead>
                        <TableHead>Username</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Full Name</TableHead>
                        <TableHead>Role</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {batchPreview.slice(0, 50).map((row, i) => (
                        <TableRow key={i}>
                          <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                          <TableCell className="font-medium">{row.username}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {row.email || `${row.username}@ilkkm.edu.my`}
                          </TableCell>
                          <TableCell>{row.full_name || "—"}</TableCell>
                          <TableCell>{row.role || "user"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {batchPreview.length > 50 && (
                    <p className="p-3 text-sm text-muted-foreground text-center">
                      ...and {batchPreview.length - 50} more rows
                    </p>
                  )}
                </div>
              )}
            </div>
            <DialogFooter className="flex-row justify-between sm:justify-between gap-2">
              <Button variant="outline" size="sm" onClick={downloadTemplate}>
                <Download className="mr-2 h-4 w-4" />
                Download Template
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setBatchOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleBatchUpload}
                  disabled={batchLoading || batchPreview.length === 0}
                >
                  {batchLoading
                    ? "Uploading..."
                    : `Upload ${batchPreview.length} User(s)`}
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Batch Delete Confirmation Dialog */}
        <Dialog open={batchDeleteOpen} onOpenChange={setBatchDeleteOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {allAcrossPages ? "Delete ALL Users" : "Delete Selected Users"}
              </DialogTitle>
              <DialogDescription>
                {allAcrossPages
                  ? `WARNING: Are you sure you want to delete ALL ${selectedIds.size} user(s)? All their bookings will also be removed. This action CANNOT be undone!`
                  : `Are you sure you want to delete ${selectedIds.size} selected user(s)? All their bookings will also be removed. This action cannot be undone.`}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setBatchDeleteOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleBatchDelete}
                disabled={batchDeleteLoading}
              >
                {batchDeleteLoading
                  ? "Deleting..."
                  : `Delete ${selectedIds.size} User(s)`}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
