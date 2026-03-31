"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getAuthToken } from "@/lib/laravel-auth";
import { backendApi } from "@/lib/api";
import { removeUserFromRole } from "@/app/actions/roles";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, ShieldCheck } from "lucide-react";

type UserRole = { roleId: string; canManage?: boolean; role?: { id: string; name: string; color?: string | null } };

export default function RevokeRolePage() {
    const params = useParams();
    const router = useRouter();
    const queryClient = useQueryClient();
    const userId = typeof params?.id === "string" ? params.id : "";

    const { data: user, isLoading } = useQuery({
        queryKey: ["admin-user", userId],
        queryFn: async () => {
            const token = getAuthToken();
            const headers: Record<string, string> = { Accept: "application/json" };
            if (token) headers["Authorization"] = `Bearer ${token}`;
            const res = await fetch(backendApi(`admin/users/${encodeURIComponent(userId)}`), {
                credentials: "include",
                headers,
            });
            if (!res.ok) throw new Error("Failed to load user");
            return res.json();
        },
        enabled: !!userId,
    });

    const [revokingId, setRevokingId] = React.useState<string | null>(null);
    const handleRevoke = async (roleId: string, roleName: string) => {
        const resolvedUserId = user?.id;
        if (!resolvedUserId) {
            toast.error("User not loaded yet.");
            return;
        }
        const ok = window.confirm(`Revoke "${roleName}" from ${user?.name ?? "this user"}?`);
        if (!ok) return;
        setRevokingId(roleId);
        try {
            await removeUserFromRole({ roleId, userId: resolvedUserId });
            queryClient.invalidateQueries({ queryKey: ["user-roles"] });
            toast.success(`User removed from ${roleName} role`);
            router.push(`/admin/users/${userId}`);
            router.refresh();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to revoke role");
            setRevokingId(null);
        }
    };

    if (!userId) {
        return (
            <div className="space-y-4 p-4">
                <Link href="/admin/users">
                    <Button variant="ghost" size="sm">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to users
                    </Button>
                </Link>
                <p className="text-muted-foreground">Invalid user.</p>
            </div>
        );
    }

    const roles: UserRole[] = Array.isArray(user?.roles) ? user.roles : [];

    return (
        <div className="space-y-6 p-4 max-w-lg">
            <div className="flex items-center gap-2">
                <Link href={`/admin/users/${userId}`}>
                    <Button variant="ghost" size="sm">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back
                    </Button>
                </Link>
            </div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
                <ShieldCheck className="h-6 w-6" />
                Revoke role from {user?.name ?? "…"}
            </h1>
            {isLoading ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading…
                </div>
            ) : (
                <ul className="space-y-1 border rounded-md divide-y divide-border/15 overflow-hidden">
                    {roles.length > 0 ? (
                        (() => {
                            const revokable = roles.filter((ur) => ur.canManage !== false);
                            if (revokable.length === 0) {
                                return (
                                    <li className="px-4 py-6 text-center text-muted-foreground">
                                        You cannot revoke any of this user&apos;s roles (they are at or above your highest role).
                                    </li>
                                );
                            }
                            return revokable.map((ur) => {
                            const role = ur.role ?? { id: ur.roleId, name: "Unknown" };
                            return (
                                <li key={role.id}>
                                    <button
                                        type="button"
                                        onClick={() => handleRevoke(role.id, role.name)}
                                        disabled={!user?.id || revokingId !== null}
                                        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-accent/50 disabled:opacity-50 transition-colors"
                                    >
                                        <span className="flex items-center gap-2">
                                            {role.color && (
                                                <span
                                                    className="w-3 h-3 rounded-full shrink-0"
                                                    style={{ backgroundColor: role.color }}
                                                />
                                            )}
                                            {role.name}
                                        </span>
                                        {revokingId === role.id ? (
                                            <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                                        ) : (
                                            <span className="text-xs text-muted-foreground">Revoke</span>
                                        )}
                                    </button>
                                </li>
                            );
                            });
                        })()
                    ) : (
                        <li className="px-4 py-6 text-center text-muted-foreground">
                            This user has no roles to revoke.
                        </li>
                    )}
                </ul>
            )}
        </div>
    );
}
