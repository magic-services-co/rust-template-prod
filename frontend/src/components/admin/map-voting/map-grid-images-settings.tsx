"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { useSiteSettings } from "@/hooks/use-site-settings";
import { backendApi } from "@/lib/api";
import { getAuthToken } from "@/lib/laravel-auth";
import { Loader2, Trash2, ImageIcon } from "lucide-react";

interface GridImageObject {
    key: string;
    lastModified: string;
}

async function fetchGridImages(): Promise<GridImageObject[]> {
    const token = getAuthToken();
    const headers: Record<string, string> = { Accept: "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const res = await fetch(backendApi("admin/map-voting/grid-images"), { credentials: "include", headers });
    if (!res.ok) throw new Error("Failed to fetch grid images");
    const data = await res.json();
    return data.objects ?? [];
}

export function MapGridImagesSettings() {
    const queryClient = useQueryClient();
    const { data: siteSettings } = useSiteSettings();
    const [retentionInput, setRetentionInput] = useState<string>("");

    useEffect(() => {
        setRetentionInput(
            siteSettings?.mapGridRetentionDays != null ? String(siteSettings.mapGridRetentionDays) : ""
        );
    }, [siteSettings?.mapGridRetentionDays]);
    const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());

    const { data: objects = [], isLoading: listLoading } = useQuery({
        queryKey: ["map-voting-grid-images"],
        queryFn: fetchGridImages,
    });

    const deleteMutation = useMutation({
        mutationFn: async (keys: string[]) => {
            const token = getAuthToken();
            const headers: Record<string, string> = { "Content-Type": "application/json", Accept: "application/json" };
            if (token) headers["Authorization"] = `Bearer ${token}`;
            const res = await fetch(backendApi("admin/map-voting/grid-images"), {
                method: "DELETE",
                credentials: "include",
                headers,
                body: JSON.stringify({ keys }),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || "Delete failed");
            }
            return res.json();
        },
        onSuccess: (data) => {
            toast.success(`Deleted ${data.deleted ?? 0} image(s).`);
            queryClient.invalidateQueries({ queryKey: ["map-voting-grid-images"] });
            setSelectedKeys(new Set());
        },
        onError: (e) => toast.error(e.message),
    });

    const cleanupMutation = useMutation({
        mutationFn: async () => {
            const token = getAuthToken();
            const headers: Record<string, string> = { "Content-Type": "application/json", Accept: "application/json" };
            if (token) headers["Authorization"] = `Bearer ${token}`;
            const res = await fetch(backendApi("admin/map-voting/grid-images/cleanup"), {
                method: "POST",
                credentials: "include",
                headers,
                body: JSON.stringify({}),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || "Cleanup failed");
            }
            return res.json();
        },
        onSuccess: (data) => {
            toast.success(`Cleanup completed. Deleted ${data.deleted ?? 0} image(s).`);
            queryClient.invalidateQueries({ queryKey: ["map-voting-grid-images"] });
        },
        onError: (e) => toast.error(e.message),
    });

    const saveRetentionMutation = useMutation({
        mutationFn: async (days: number | null) => {
            const res = await fetch(backendApi("admin/site-settings"), {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ mapGridRetentionDays: days }),
                credentials: "include",
            });
            if (!res.ok) throw new Error("Failed to save retention");
            return res.json();
        },
        onSuccess: () => {
            toast.success("Retention setting saved.");
            queryClient.invalidateQueries({ queryKey: ["siteSettings"] });
        },
        onError: () => toast.error("Failed to save retention."),
    });

    const currentRetention = siteSettings?.mapGridRetentionDays ?? null;
    const retentionNum = retentionInput === "" ? null : parseInt(retentionInput, 10);

    const toggleKey = (key: string) => {
        setSelectedKeys((prev) => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
        });
    };

    const selectAll = () => {
        if (selectedKeys.size === objects.length) setSelectedKeys(new Set());
        else setSelectedKeys(new Set(objects.map((o) => o.key)));
    };

    const deleteSelected = () => {
        if (selectedKeys.size === 0) {
            toast.error("Select at least one image.");
            return;
        }
        deleteMutation.mutate(Array.from(selectedKeys));
    };

    const deleteAll = () => {
        if (objects.length === 0) return;
        if (!confirm(`Delete all ${objects.length} grid images? This cannot be undone.`)) return;
        deleteMutation.mutate(objects.map((o) => o.key));
    };

    const runCleanup = () => {
        if (currentRetention == null || currentRetention < 1) {
            toast.error("Set retention days above and save, then run cleanup.");
            return;
        }
        cleanupMutation.mutate();
    };

    const saveRetention = () => {
        if (retentionInput === "") {
            saveRetentionMutation.mutate(null);
            return;
        }
        if (retentionNum == null || isNaN(retentionNum) || retentionNum < 1) {
            toast.error("Enter a valid number of days (1 or more).");
            return;
        }
        saveRetentionMutation.mutate(retentionNum);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <ImageIcon className="h-5 w-5" />
                    Grid images (local & R2)
                </CardTitle>
                <CardDescription>
                    Images in the <code className="text-xs bg-muted px-1 rounded">map-grids</code> folder. Generated when a map vote is created or updated. Stored on local disk or Cloudflare R2 depending on CDN settings. Remove old images or set retention to auto-delete by age.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Retention */}
                <div className="flex flex-wrap items-end gap-2">
                    <div className="space-y-1">
                        <label className="text-sm font-medium">Retention (days)</label>
                        <Input
                            type="number"
                            min={1}
                            placeholder="e.g. 30"
                            value={retentionInput}
                            onChange={(e) => setRetentionInput(e.target.value)}
                            className="w-28"
                        />
                    </div>
                    <Button
                        size="sm"
                        variant="secondary"
                        onClick={saveRetention}
                        disabled={saveRetentionMutation.isPending}
                    >
                        {saveRetentionMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={runCleanup}
                        disabled={cleanupMutation.isPending || !currentRetention || currentRetention < 1}
                    >
                        {cleanupMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Run cleanup now"}
                    </Button>
                    <span className="text-sm text-muted-foreground">
                        {currentRetention != null && currentRetention >= 1
                            ? `Deletes images older than ${currentRetention} days.`
                            : "Set days and save to enable cleanup."}
                    </span>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2">
                    <Button
                        size="sm"
                        variant="destructive"
                        onClick={deleteSelected}
                        disabled={deleteMutation.isPending || selectedKeys.size === 0}
                    >
                        {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        <span className="ml-1">Delete selected ({selectedKeys.size})</span>
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={deleteAll}
                        disabled={deleteMutation.isPending || objects.length === 0}
                    >
                        Delete all ({objects.length})
                    </Button>
                </div>

                {/* List */}
                {listLoading ? (
                    <Skeleton className="h-40 w-full" />
                ) : objects.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No grid images.</p>
                ) : (
                    <div className="rounded-md border overflow-auto max-h-64">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b bg-muted/50">
                                    <th className="p-2 text-left w-10">
                                        <Checkbox
                                            checked={selectedKeys.size === objects.length && objects.length > 0}
                                            onCheckedChange={selectAll}
                                        />
                                    </th>
                                    <th className="p-2 text-left">Key</th>
                                    <th className="p-2 text-left">Age</th>
                                </tr>
                            </thead>
                            <tbody>
                                {objects.map((obj) => (
                                    <tr key={obj.key} className="border-b last:border-0">
                                        <td className="p-2">
                                            <Checkbox
                                                checked={selectedKeys.has(obj.key)}
                                                onCheckedChange={() => toggleKey(obj.key)}
                                            />
                                        </td>
                                        <td className="p-2 font-mono text-xs truncate max-w-xs" title={obj.key}>
                                            {obj.key}
                                        </td>
                                        <td className="p-2 text-muted-foreground">
                                            {formatDistanceToNow(new Date(obj.lastModified), { addSuffix: true })}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
