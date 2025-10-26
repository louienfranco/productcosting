"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
  listSaves,
  deleteSave,
  type SavedRecord,
  type StorageData,
} from "@/lib/idb-saves";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLoad: (data: StorageData) => void;
};

export default function SavedDataModal({ open, onOpenChange, onLoad }: Props) {
  const [saves, setSaves] = useState<SavedRecord[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = async () => {
    setLoading(true);
    try {
      const items = await listSaves();
      setSaves(items);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) refresh();
  }, [open]);

  const handleDelete = async (id: string) => {
    await deleteSave(id);
    await refresh();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Saved Data</DialogTitle>
          <DialogDescription>
            Load or delete your previously saved sessions.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div className="text-sm text-muted-foreground">Loading…</div>
          ) : saves.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              No saved sessions yet.
            </div>
          ) : (
            saves.map((s) => (
              <div key={s.id} className="rounded-md border p-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-medium truncate">
                      {s.name || "Untitled session"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(s.createdAt).toLocaleString()} •{" "}
                      {s.data?.rows?.length ?? 0} ingredients
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button size="sm" onClick={() => onLoad(s.data)}>
                      Load
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(s.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <Separator />

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
