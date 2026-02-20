"use client";

import { useState, useEffect, useRef } from "react";
import { ImagePlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export function ClassroomDialog({ open, onOpenChange, classroom, defaultGroupId, onSuccess }) {
  const isEdit = !!classroom;
  const [loading, setLoading] = useState(false);
  const [roomGroups, setRoomGroups] = useState([]);
  const fileInputRef = useRef(null);
  const [lightboxSrc, setLightboxSrc] = useState(null);
  const [form, setForm] = useState({
    name: "",
    groupId: "",
    location: "",
    capacity: "",
    description: "",
    notes: "",
    photo: "",
    canBeBooked: true,
    status: "available",
  });

  useEffect(() => {
    fetch("/api/room-groups")
      .then((r) => r.json())
      .then((data) => setRoomGroups(data.roomGroups || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (classroom) {
      setForm({
        name: classroom.name || "",
        groupId: classroom.group_id ? String(classroom.group_id) : "",
        location: classroom.location || "",
        capacity: classroom.capacity?.toString() || "",
        description: classroom.description || "",
        notes: classroom.notes || "",
        photo: classroom.photo || "",
        canBeBooked: classroom.can_be_booked !== 0,
        status: classroom.status || "available",
      });
    } else {
      setForm({
        name: "",
        groupId: defaultGroupId ? String(defaultGroupId) : "",
        location: "",
        capacity: "",
        description: "",
        notes: "",
        photo: "",
        canBeBooked: true,
        status: "available",
      });
    }
  }, [classroom, defaultGroupId, open]);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);

    try {
      const url = isEdit
        ? `/api/classrooms/${classroom.id}`
        : "/api/classrooms";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          groupId: form.groupId ? parseInt(form.groupId, 10) : defaultGroupId ? parseInt(defaultGroupId, 10) : null,
          location: form.location || null,
          capacity: form.capacity ? parseInt(form.capacity, 10) : null,
          description: form.description || null,
          notes: form.notes || null,
          photo: form.photo || null,
          canBeBooked: form.canBeBooked,
          status: form.status,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      onSuccess?.(data.classroom, isEdit ? "updated" : "created");
      onOpenChange(false);
    } catch (error) {
      toast.error(error?.message || "Failed to save classroom");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Classroom" : "Add Classroom"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the classroom details below."
              : "Fill in the details to create a new classroom."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Lab Komputer 1"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="roomGroup">Room Group</Label>
              <Select
                value={form.groupId}
                onValueChange={(value) =>
                  setForm({ ...form, groupId: value === "none" ? "" : value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select group..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {roomGroups.map((group) => (
                    <SelectItem key={group.id} value={String(group.id)}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="e.g. Block A, Level 2"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="capacity">Capacity</Label>
              <Input
                id="capacity"
                type="number"
                min="0"
                value={form.capacity}
                onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                placeholder="e.g. 40"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              placeholder="Optional description..."
              rows={2}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Internal notes..."
              rows={2}
            />
          </div>
          <div className="space-y-2">
            <Label>Photo</Label>
            {form.photo ? (
              <div className="relative">
                <button
                  type="button"
                  className="w-full transition hover:opacity-90"
                  onClick={() => setLightboxSrc(form.photo)}
                >
                  <img
                    src={form.photo}
                    alt="Classroom"
                    className="h-32 w-full rounded-lg border object-cover"
                  />
                </button>
                <button
                  type="button"
                  className="absolute top-1 right-1 rounded-full bg-background/80 p-1 text-destructive shadow hover:bg-background"
                  onClick={() => setForm({ ...form, photo: "" })}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="flex h-24 w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/25 text-sm text-muted-foreground transition hover:border-primary hover:text-primary"
                onClick={() => fileInputRef.current?.click()}
              >
                <ImagePlus className="h-5 w-5" />
                Upload Photo
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                if (file.size > 10 * 1024 * 1024) {
                  toast.error("File is too large. Maximum size is 10MB");
                  return;
                }
                const reader = new FileReader();
                reader.onload = (ev) => {
                  setForm((prev) => ({ ...prev, photo: ev.target.result }));
                };
                reader.readAsDataURL(file);
                e.target.value = "";
              }}
            />
            <p className="text-xs text-muted-foreground">JPG, PNG or GIF. Max 10MB.</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={form.status}
                onValueChange={(value) => setForm({ ...form, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="bookable">Bookable</Label>
              <Select
                value={form.canBeBooked ? "yes" : "no"}
                onValueChange={(value) =>
                  setForm({ ...form, canBeBooked: value === "yes" })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading
                ? isEdit
                  ? "Saving..."
                  : "Creating..."
                : isEdit
                  ? "Save Changes"
                  : "Create Classroom"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>

      {/* Image Lightbox */}
      {lightboxSrc && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4"
          onClick={() => setLightboxSrc(null)}
        >
          <button
            type="button"
            className="absolute top-4 right-4 rounded-full bg-white/20 p-2 text-white transition hover:bg-white/40"
            onClick={() => setLightboxSrc(null)}
          >
            <X className="h-5 w-5" />
          </button>
          <img
            src={lightboxSrc}
            alt="Classroom photo"
            className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </Dialog>
  );
}
