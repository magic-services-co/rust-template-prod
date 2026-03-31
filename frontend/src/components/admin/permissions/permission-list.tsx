"use client";

import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from "@/components/ui/scroll-area";
import { backendApi } from '@/lib/api';
import { getAuthToken } from '@/lib/laravel-auth';
import { getRoles } from '@/app/actions/roles';
import { RoleList } from './role-list';
import { PermissionTab } from './permission-tab';
import { UserTab } from './user-tab';
import { Role } from '@/types/user';
import { SettingsTab } from './settings-tab';
import { Permission } from '@/lib/roles';
import { Button } from "@/components/ui/button";
import { AddRoleForm } from "./add-role-form";
import { toast } from "sonner";

interface RoleWithPermissions extends Omit<Role, 'permissions' | 'users'> {
    permissions: Permission[];
    users: {
        id: string;
        name: string | null;
        image: string | null;
    }[];
}

export function PermissionList() {
    const [selectedRole, setSelectedRole] = useState<RoleWithPermissions | null>(null);
    const [roles, setRoles] = useState<RoleWithPermissions[]>([]);
    const queryClient = useQueryClient();

    const { data: rolesData } = useQuery({
        queryKey: ['user-roles'],
        queryFn: () => getRoles(),
    });

    useEffect(() => {
        if (rolesData) {
            const typedRoles = rolesData.map((role) => ({
                ...role,
                permissions: role.permissions || [],
                users: role.users || []
            })) as unknown as RoleWithPermissions[];
            setRoles(typedRoles);
        }
    }, [rolesData]);

    useEffect(() => {
        if (selectedRole && roles) {
            const updatedRole = roles.find((role) => role.id === selectedRole.id);
            if (updatedRole) {
                setSelectedRole(updatedRole);
            }
        }
    }, [selectedRole, roles]);

    const handleReorderRoles = async (roleIds: string[]) => {
        try {
            const token = getAuthToken();
            const headers: Record<string, string> = { 'Content-Type': 'application/json', Accept: 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;
            const response = await fetch(backendApi('admin/roles/reorder'), {
                method: 'POST',
                headers,
                credentials: 'include',
                body: JSON.stringify({ roleIds }),
            });

            if (!response.ok) {
                const data = await response.json().catch(() => ({})) as { error?: string };
                throw new Error(data?.error ?? 'Failed to reorder roles');
            }

            await queryClient.invalidateQueries({ queryKey: ['user-roles'] });
            toast.success('Roles reordered successfully');
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to reorder roles';
            toast.error(message);
        }
    };

    return (
        <div className="flex h-[calc(100vh-4rem)]">
            <Card className="w-1/4 mr-4">
                <CardHeader>
                    <CardTitle>Roles</CardTitle>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-[calc(100vh-200px)]">
                        <RoleList
                            roles={roles as unknown as Role[]}
                            selectedRole={selectedRole as unknown as Role | undefined}
                            onSelectRole={(role) => setSelectedRole(role as unknown as RoleWithPermissions)}
                            onReorderRoles={handleReorderRoles}
                        />
                    </ScrollArea>
                </CardContent>
            </Card>

            <Card className="w-3/4">
                <CardHeader>
                    <CardTitle>{typeof selectedRole?.name === 'string' ? selectedRole.name : 'Select a role'}</CardTitle>
                </CardHeader>
                <CardContent>
                    {selectedRole && (
                        <Tabs defaultValue="settings">
                            <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="settings">Settings</TabsTrigger>
                                <TabsTrigger value="permissions">Permissions</TabsTrigger>
                                <TabsTrigger value="users">Manage Users</TabsTrigger>
                            </TabsList>
                            <TabsContent value="settings">
                                <SettingsTab role={selectedRole as unknown as Role} />
                            </TabsContent>
                            <TabsContent value="permissions">
                                <PermissionTab role={selectedRole as unknown as Role} />
                            </TabsContent>
                            <TabsContent value="users">
                                <UserTab role={selectedRole as unknown as Role} />
                            </TabsContent>
                        </Tabs>
                    )}
                </CardContent>
            </Card>
        </div>
    );
} 