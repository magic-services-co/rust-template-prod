"use client";

import { useState, useMemo, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { permissions, PermissionCategory, Permission } from "@/lib/roles";
import { Role } from "@/types/user";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface PermissionTabProps {
    role: Role;
}

function getPermissionIds(permissions: Partial<Permission>[] | undefined): string[] {
    return permissions?.map(p => p.id).filter((id): id is string => id !== undefined) ?? [];
}

export function PermissionTab({ role }: PermissionTabProps) {
    const queryClient = useQueryClient();
    const [localPermissions, setLocalPermissions] = useState<string[]>([]);

    useEffect(() => {
        setLocalPermissions(getPermissionIds(role.permissions));
    }, [role]);

    const hasPermissionsChanged = useMemo(() => {
        const defaultPermissions = getPermissionIds(role.permissions);
        return !localPermissions.every(p => defaultPermissions.includes(p)) ||
            !defaultPermissions.every(p => localPermissions.includes(p));
    }, [localPermissions, role.permissions]);

    const groupedPermissions = useMemo(() => {
        return permissions.reduce((acc, permission) => {
            if (!acc[permission.category]) {
                acc[permission.category] = [];
            }
            acc[permission.category].push(permission);
            return acc;
        }, {} as Record<PermissionCategory, typeof permissions>);
    }, []);

    const updatePermissionsMutation = useMutation({
        mutationFn: async (updatedPermissions: string[]) => {
            const { backendApi } = await import('@/lib/api');
            const { getAuthToken } = await import('@/lib/laravel-auth');
            const token = getAuthToken();
            const headers: Record<string, string> = { 'Content-Type': 'application/json', Accept: 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;
            const response = await fetch(backendApi(`admin/roles/${role.id}`), {
                method: 'PUT',
                credentials: 'include',
                headers,
                body: JSON.stringify({ permissions: updatedPermissions }),
            });
            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                const msg = data?.error ?? data?.message ?? (data?.errors && typeof data.errors === 'object' ? Object.values(data.errors).flat().join(' ') : null) ?? 'Failed to update permissions';
                throw new Error(msg);
            }
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['user-roles'] });
            toast.success("Role permissions updated successfully");
        },
        onError: (error) => {
            toast.error(error.message || "Failed to update role permissions");
        },
    });

    const handleToggle = (permissionId: string) => {
        setLocalPermissions(prev =>
            prev.includes(permissionId)
                ? prev.filter(p => p !== permissionId)
                : [...prev, permissionId]
        );
    };

    const handleSaveChanges = () => {
        updatePermissionsMutation.mutate(localPermissions);
    };

    return (
        <ScrollArea className="h-[calc(100vh-13rem)] mt-4 pr-4">
            <div className="space-y-8">
                {role.canManage === false && (
                    <div className="rounded-md bg-muted/50 border border-border p-3 text-sm text-muted-foreground">
                        You cannot edit this role&apos;s permissions. You can only manage roles below your highest role.
                    </div>
                )}
                {hasPermissionsChanged && role.canManage !== false && (
                    <div className="flex justify-end">
                        <Button
                            className=""
                            onClick={handleSaveChanges}
                            disabled={updatePermissionsMutation.isPending}
                        >
                            {updatePermissionsMutation.isPending ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>
                )}
                {Object.entries(groupedPermissions).map(([category, categoryPermissions]) => (
                    <div key={category} className="space-y-4">
                        <h3 className="text-lg font-semibold">{category}</h3>
                        {categoryPermissions.map((permission) => (
                            <div key={permission.id} className="flex bg-secondary/15 rounded-md p-4 items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label htmlFor={permission.id} className="text-base font-semibold">{permission.title}</Label>
                                    <p className="text-[0.8rem] text-muted-foreground">{permission.description}</p>
                                </div>
                                <Switch
                                    id={permission.id}
                                    checked={localPermissions.includes(permission.id)}
                                    onCheckedChange={() => role.canManage !== false && handleToggle(permission.id)}
                                    disabled={role.canManage === false}
                                />
                            </div>
                        ))}
                    </div>
                ))}
            </div>
            {hasPermissionsChanged && role.canManage !== false && (
                <div className="flex justify-end pb-4">
                    <Button
                        className="mt-4"
                        onClick={handleSaveChanges}
                        disabled={updatePermissionsMutation.isPending}
                    >
                        {updatePermissionsMutation.isPending ? 'Saving...' : 'Save Changes'}
                    </Button>
                </div>
            )}
        </ScrollArea>
    );
}