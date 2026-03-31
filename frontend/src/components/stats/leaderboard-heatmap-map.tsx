"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { KillHeatmapPoint } from "@/lib/leaderboard-kill-heatmap";
import { gridToPixel } from "@/lib/leaderboard-kill-heatmap";

const ZOOM_MIN = 1;
const ZOOM_MAX = 3.5;
const ZOOM_STEP = 0.2;

function clampZoom(z: number): number {
  const rounded = Math.round(z * 100) / 100;
  if (rounded < ZOOM_MIN) return ZOOM_MIN;
  if (rounded > ZOOM_MAX) return ZOOM_MAX;
  return rounded;
}

function clampPan(
  zoom: number,
  vw: number,
  vh: number,
  pan: { x: number; y: number },
): { x: number; y: number } {
  if (zoom <= 1 + 1e-6 || vw <= 0 || vh <= 0) {
    return { x: 0, y: 0 };
  }
  const maxX = (vw * (zoom - 1)) / 2;
  const maxY = (vh * (zoom - 1)) / 2;
  return {
    x: Math.min(maxX, Math.max(-maxX, pan.x)),
    y: Math.min(maxY, Math.max(-maxY, pan.y)),
  };
}

type LeaderboardHeatmapMapProps = {
  className?: string;
  showHeatmap?: boolean;
  killPoints?: KillHeatmapPoint[];
  killPointTint?: string;
};

export function LeaderboardHeatmapMap({
  className,
  showHeatmap = true,
  killPoints = [],
  killPointTint = "rgba(239, 68, 68, 0.5)",
}: LeaderboardHeatmapMapProps) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [viewportSize, setViewportSize] = useState({ w: 0, h: 0 });
  const [dragging, setDragging] = useState(false);

  const viewportRef = useRef<HTMLDivElement>(null);
  const mapLayerRef = useRef<HTMLDivElement>(null);
  const killCanvasRef = useRef<HTMLCanvasElement>(null);
  const zoomRef = useRef(1);
  const panRef = useRef({ x: 0, y: 0 });
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    startPan: { x: number; y: number };
  } | null>(null);

  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

  useEffect(() => {
    panRef.current = pan;
  }, [pan]);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const measure = () => {
      setViewportSize({ w: el.clientWidth, h: el.clientHeight });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const applyPan = useCallback(
    (next: { x: number; y: number }) => {
      const z = zoomRef.current;
      const { w, h } = viewportSize;
      const clamped = clampPan(z, w, h, next);
      const prev = panRef.current;
      if (prev.x === clamped.x && prev.y === clamped.y) return;
      panRef.current = clamped;
      setPan(clamped);
    },
    [viewportSize.w, viewportSize.h],
  );

  useEffect(() => {
    applyPan(panRef.current);
  }, [zoom, viewportSize.w, viewportSize.h, applyPan]);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const delta = e.deltaY > 0 ? -ZOOM_STEP * 0.5 : ZOOM_STEP * 0.5;
      const nextZ = clampZoom(zoomRef.current + delta);
      zoomRef.current = nextZ;
      setZoom(nextZ);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  const zoomIn = useCallback(() => {
    setZoom((z) => {
      const next = clampZoom(z + ZOOM_STEP);
      zoomRef.current = next;
      return next;
    });
  }, []);

  const zoomOut = useCallback(() => {
    setZoom((z) => {
      const next = clampZoom(z - ZOOM_STEP);
      zoomRef.current = next;
      return next;
    });
  }, []);

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.button !== 0) return;
      if (zoomRef.current <= 1 + 1e-6) return;
      e.preventDefault();
      e.currentTarget.setPointerCapture(e.pointerId);
      dragRef.current = {
        pointerId: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        startPan: { ...panRef.current },
      };
      setDragging(true);
    },
    [],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const d = dragRef.current;
      if (!d || e.pointerId !== d.pointerId) return;
      const dx = e.clientX - d.startX;
      const dy = e.clientY - d.startY;
      applyPan({
        x: d.startPan.x + dx,
        y: d.startPan.y + dy,
      });
    },
    [applyPan],
  );

  const endDrag = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const d = dragRef.current;
    if (!d || e.pointerId !== d.pointerId) return;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
    }
    dragRef.current = null;
    setDragging(false);
  }, []);

  const z = clampZoom(zoom);
  const canPan = z > 1 + 1e-6;

  const [layerTick, setLayerTick] = useState(0);
  useEffect(() => {
    const layer = mapLayerRef.current;
    if (!layer) return;
    const ro = new ResizeObserver(() => setLayerTick((t) => t + 1));
    ro.observe(layer);
    return () => ro.disconnect();
  }, [z, viewportSize.w, viewportSize.h]);

  useLayoutEffect(() => {
    const canvas = killCanvasRef.current;
    const layer = mapLayerRef.current;
    if (!canvas || !layer) return;

    const w = layer.clientWidth;
    const h = layer.clientHeight;
    if (w <= 0 || h <= 0) return;

    const dpr = Math.min(2, typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    if (!showHeatmap || killPoints.length === 0) return;

    const radius = Math.max(8, Math.min(22, w * 0.022));
    for (const p of killPoints) {
      const px = gridToPixel(p.x, w);
      const py = gridToPixel(p.y, h);
      const g = ctx.createRadialGradient(px, py, 0, px, py, radius);
      g.addColorStop(0, killPointTint);
      g.addColorStop(0.55, killPointTint.replace(/,\s*[\d.]+\s*\)/, ", 0.12)"));
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(px, py, radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [killPoints, killPointTint, showHeatmap, z, viewportSize.w, viewportSize.h, layerTick]);

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden rounded-md border border-border bg-zinc-950/40",
        className,
      )}
    >
      <div className="absolute left-2 top-2 z-20 flex flex-col gap-1 rounded-md border border-border/80 bg-background/90 p-1 shadow-sm backdrop-blur-sm">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={zoomIn}
          disabled={zoom >= ZOOM_MAX - 0.01}
          aria-label="Zoom in"
        >
          <Plus className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={zoomOut}
          disabled={zoom <= ZOOM_MIN + 0.01}
          aria-label="Zoom out"
        >
          <Minus className="h-4 w-4" />
        </Button>
      </div>

      <div className="pointer-events-none absolute bottom-2 right-2 z-20 rounded bg-background/80 px-2 py-0.5 font-mono text-[10px] text-muted-foreground tabular-nums backdrop-blur-sm">
        {Math.round(z * 100)}%{canPan ? " · drag" : ""}
      </div>

      <div className="aspect-square w-full max-h-[min(560px,85svh)]">
        <div
          ref={viewportRef}
          role="application"
          aria-label="Map viewport, scroll wheel zooms, drag when zoomed"
          className={cn(
            "relative h-full w-full touch-none overflow-hidden select-none",
            canPan && (dragging ? "cursor-grabbing" : "cursor-grab"),
          )}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        >
          <div
            ref={mapLayerRef}
            className="absolute will-change-transform"
            style={{
              width: `${100 * z}%`,
              height: `${100 * z}%`,
              left: "50%",
              top: "50%",
              transform: `translate(calc(-50% + ${pan.x}px), calc(-50% + ${pan.y}px))`,
            }}
          >
            <div
              className="absolute inset-0 bg-[#1a1b1e] transition-colors duration-200"
              aria-hidden
            />

            <canvas
              ref={killCanvasRef}
              className="pointer-events-none absolute inset-0 h-full w-full mix-blend-screen"
              aria-hidden
            />
          </div>
        </div>
      </div>
    </div>
  );
}
