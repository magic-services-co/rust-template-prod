"use client";

import { Map } from "lucide-react";
import { Dialog, DialogClose, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type ServerRgtMapDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Physgun RGT viewer URL (`https://rgt.physgun.com/?...`). */
  iframeSrc: string;
  title: string;
};

export function ServerRgtMapDialog({ open, onOpenChange, iframeSrc, title }: ServerRgtMapDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        aria-describedby={undefined}
        className={cn(
          "fixed left-1/2 top-1/2 z-[60] flex h-[min(92vh,920px)] w-[min(98vw,1240px)] max-w-none -translate-x-1/2 -translate-y-1/2 flex-col gap-0 overflow-hidden rounded-xl border-2 border-[#232527] bg-[#232527] p-0 shadow-2xl",
          "[&>button.absolute.right-4]:hidden",
        )}
      >
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-black/35 bg-[#232527] px-4 py-3">
          <div className="flex min-w-0 flex-1 items-center gap-2.5 text-sm font-medium text-zinc-100">
            <Map className="h-4 w-4 shrink-0 text-zinc-400" aria-hidden />
            <span className="truncate">{title}</span>
          </div>
          <DialogClose asChild>
            <button
              type="button"
              className="shrink-0 rounded-md px-2 py-1.5 text-xs font-semibold uppercase tracking-wide text-zinc-400 transition-colors hover:bg-white/5 hover:text-zinc-100"
            >
              <span aria-hidden>✕</span> Close
            </button>
          </DialogClose>
        </header>
        <div className="relative min-h-0 flex-1 bg-black">
          {open ? (
            <iframe
              title={`3D map — ${title}`}
              src={iframeSrc}
              className="absolute inset-0 h-full w-full border-0"
              allow="accelerometer; gyroscope; fullscreen; xr-spatial-tracking"
              allowFullScreen
            />
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
