"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function FirstLoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    departmentId: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    // Fetch current user info
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        const user = data.user || data;
        setCurrentUser(user);
        setForm((prev) => ({
          ...prev,
          fullName: user.name || user.full_name || "",
          email: user.email || "",
        }));
      })
      .catch(() => {});

    // Fetch departments
    fetch("/api/departments")
      .then((r) => r.json())
      .then((data) => setDepartments(data.departments || []))
      .catch(() => {});
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();

    if (!form.fullName.trim()) {
      toast.error("Full name is required");
      return;
    }

    if (!form.email.trim()) {
      toast.error("Email is required");
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (form.newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/first-login-password-change", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: form.fullName,
          email: form.email,
          departmentId: form.departmentId && form.departmentId !== "none" ? form.departmentId : null,
          newPassword: form.newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to complete profile");
      }

      toast.success("Profile completed successfully!");
      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      toast.error(error?.message || "Failed to complete profile");
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    fetch("/api/auth/logout", { method: "POST" })
      .then(() => {
        router.push("/login");
        router.refresh();
      })
      .catch(() => router.push("/login"));
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">
            Complete Your Profile
          </CardTitle>
          <CardDescription>
            Welcome to the system! Please complete your profile information
            and set a new password before continuing.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username (readonly) */}
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={currentUser?.username || ""}
                disabled
                className="bg-muted"
              />
            </div>

            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name *</Label>
              <Input
                id="fullName"
                value={form.fullName}
                onChange={(e) =>
                  setForm({ ...form, fullName: e.target.value })
                }
                placeholder="Enter your full name"
                required
                autoFocus
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) =>
                  setForm({ ...form, email: e.target.value })
                }
                placeholder="Enter your email address"
                required
              />
            </div>

            {/* Department */}
            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Select
                value={form.departmentId}
                onValueChange={(value) =>
                  setForm({ ...form, departmentId: value })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select department (optional)" />
                </SelectTrigger>
                <SelectContent position="popper" className="max-h-60 overflow-y-auto">
                  <SelectItem value="none">No Department</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={String(dept.id)}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* New Password */}
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password *</Label>
              <Input
                id="newPassword"
                type="password"
                value={form.newPassword}
                onChange={(e) =>
                  setForm({ ...form, newPassword: e.target.value })
                }
                placeholder="Enter new password (min. 8 characters)"
                required
                minLength={8}
              />
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password *</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={form.confirmPassword}
                onChange={(e) =>
                  setForm({ ...form, confirmPassword: e.target.value })
                }
                placeholder="Confirm new password"
                required
                minLength={8}
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Saving..." : "Save & Continue"}
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={handleLogout}
            >
              Back to Login
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
