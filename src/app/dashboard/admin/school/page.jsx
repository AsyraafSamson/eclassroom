"use client";

import { useState, useEffect } from "react";
import { School } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";

export default function SchoolSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    siteTitle: "",
    schoolName: "",
    website: "",
    loginMessage: "",
  });

  useEffect(() => {
    fetch("/api/school-info")
      .then((r) => r.json())
      .then((data) => {
        const info = data.schoolInfo || {};
        setForm({
          siteTitle: info.site_title || "",
          schoolName: info.school_name || "",
          website: info.website || "",
          loginMessage: info.login_message || "",
        });
      })
      .catch(() => toast.error("Failed to load school info"))
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/school-info", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("School settings updated");
    } catch (error) {
      toast.error(error?.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-2xl font-semibold font-[var(--font-display)]">
          School Details
        </h2>
        <p className="text-sm text-muted-foreground">
          Update campus profile and system branding
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
              <School className="h-4 w-4 text-foreground" />
            </div>
            <div>
              <CardTitle className="text-base">General Information</CardTitle>
              <CardDescription>Visible across the platform</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="siteTitle">Site Title</Label>
                <Input
                  id="siteTitle"
                  value={form.siteTitle}
                  onChange={(e) => setForm({ ...form, siteTitle: e.target.value })}
                  placeholder="eClassroom"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="schoolName">School Name</Label>
                <Input
                  id="schoolName"
                  value={form.schoolName}
                  onChange={(e) => setForm({ ...form, schoolName: e.target.value })}
                  placeholder="My School"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                type="url"
                value={form.website}
                onChange={(e) => setForm({ ...form, website: e.target.value })}
                placeholder="https://school.example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="loginMessage">Login Message</Label>
              <Textarea
                id="loginMessage"
                value={form.loginMessage}
                onChange={(e) => setForm({ ...form, loginMessage: e.target.value })}
                placeholder="Message shown on the login page..."
                rows={3}
              />
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : "Save Settings"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
