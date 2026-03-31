"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { getAuthToken } from "@/lib/laravel-auth";
import { backendApi } from "@/lib/api";
import { addUserToRole } from "@/app/actions/roles";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { User } from "@/types/user";
import { ShieldCheck, Loader2 } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

interface RoleActionProps {
    user: User;
    trigger: React.ReactNode;
}

type Role = { id: string; name: string; color?: string | null; canManage?: boolean };

export default function GrantRole({ user }: { user: User }) {
    if (Array.isArray(user?.roles) && user.roles.length > 0) {
        return (
            <RevokeRole
                user={user}
                trigger={
                    <Button variant="destructive" size="sm">
                        <ShieldCheck className="mr-2" size={18} />
                        Revoke Role
                    </Button>
                }
            />
        );
    }
    return (
        <AssignRole
            user={user}
            trigger={
                <Button variant="secondary" size="sm">
                    <ShieldCheck className="mr-2" size={18} />
                    Assign Role
                </Button>
            }
        />
    );
}

export function AssignRole({ user, trigger }: RoleActionProps) {
    const [open, setOpen] = useState(false);
    const [roles, setRoles] = useState<Role[]>([]);
    const [rolesLoading, setRolesLoading] = useState(false);
    const [rolesError, setRolesError] = useState<string | null>(null);
    const [assigningId, setAssigningId] = useState<string | null>(null);
    const router = useRouter();
    const queryClient = useQueryClient();

    const userId = user?.id ?? "";

    const loadRoles = useCallback(async () => {
        setRolesLoading(true);
        setRolesError(null);
        try {
            const token = getAuthToken();
            const headers: Record<string, string> = { Accept: "application/json" };
            if (token) headers["Authorization"] = `Bearer ${token}`;
            const res = await fetch(backendApi("admin/settings/roles"), {
                credentials: "include",
                headers,
            });
            if (!res.ok) throw new Error("Failed to load roles");
            const raw = await res.json();
            const list = Array.isArray(raw) ? (raw as Role[]) : [];
            setRoles(list.filter((r) => r.canManage !== false));
        } catch (e) {
            const msg = e instanceof Error ? e.message : "Failed to load roles";
            setRolesError(msg);
            setRoles([]);
        } finally {
            setRolesLoading(false);
        }
    }, []);

    useEffect(() => {
        if (open) loadRoles();
    }, [open, loadRoles]);

    const handleOpen = useCallback(() => {
        setRolesError(null);
        window.setTimeout(() => setOpen(true), 0);
    }, []);

    const handleAssign = (role: Role) => {
        if (!userId) {
            toast.error("User not loaded.");
            return;
        }
        window.setTimeout(() => {
            setAssigningId(role.id);
            addUserToRole({ roleId: role.id, userId })
                .then(() => {
                    setOpen(false);
                    setAssigningId(null);
                    toast.success(`User added to ${role.name} role`);
                    queryClient.invalidateQueries({ queryKey: ["user-roles"] });
                    queryClient.invalidateQueries({ queryKey: ["admin-user", userId] });
                    queryClient.invalidateQueries({ queryKey: ["user", userId] });
                    router.refresh();
                })
                .catch((err) => {
                    toast.error(err instanceof Error ? err.message : "Failed to assign role");
                    setAssigningId(null);
                });
        }, 0);
    };

    return (
        <>
            <div
                role="button"
                tabIndex={0}
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleOpen();
                }}
                onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        e.stopPropagation();
                        handleOpen();
                    }
                }}
                className="inline-block"
            >
                {trigger}
            </div>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <ShieldCheck className="h-6 w-6" />
                            Assign role to {user?.name ?? "…"}
                        </DialogTitle>
                    </DialogHeader>
                    {rolesLoading ? (
                        <div className="flex items-center gap-2 text-muted-foreground py-6">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Loading…
                        </div>
                    ) : rolesError ? (
                        <p className="py-4 text-destructive text-sm">{rolesError}</p>
                    ) : (
                        <ul className="space-y-1 border rounded-md divide-y divide-border/15 overflow-hidden">
                            {roles.length > 0 ? (
                                roles.map((role) => (
                                    <li key={role.id}>
                                        <button
                                            type="button"
                                            onClick={() => handleAssign(role)}
                                            disabled={!userId || assigningId !== null}
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
                                            {assigningId === role.id ? (
                                                <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                                            ) : (
                                                <span className="text-xs text-muted-foreground">Assign</span>
                                            )}
                                        </button>
                                    </li>
                                ))
                            ) : (
                                <li className="px-4 py-6 text-center text-muted-foreground">
                                    No roles available.
                                </li>
                            )}
                        </ul>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}

export function RevokeRole({ user, trigger }: RoleActionProps) {
    const router = useRouter();
    const href = `/admin/users/${encodeURIComponent(user.id)}/revoke-role`;
    return (
        <span
            role="button"
            tabIndex={0}
            onClick={() => router.push(href)}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); router.push(href); } }}
            className="inline-block"
        >
            {trigger}
        </span>
    );
}
