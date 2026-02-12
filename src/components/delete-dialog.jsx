"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export function DeleteDialog({
  open,
  onOpenChange,
  title,
  description,
  apiUrl,
  onSuccess,
}) {
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!apiUrl) return;
    setLoading(true);

    try {
      const res = await fetch(apiUrl, { method: "DELETE" });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      toast.error(error?.message || "Failed to delete");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title || "Confirm Delete"}</DialogTitle>
          <DialogDescription>
            {description || "Are you sure? This action cannot be undone."}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={loading}
          >
            {loading ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
