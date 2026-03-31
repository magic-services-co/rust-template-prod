"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addUserToRole, removeUserFromRole } from "@/app/actions/roles";
import { ShieldPlus, X } from "lucide-react";
import { Role } from "@/types/user";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface UserTabProps {
    role: Role;
}

export function UserTab({ role }: UserTabProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const queryClient = useQueryClient();

    const addUserMutation = useMutation({
        mutationFn: addUserToRole,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['user-roles'] });
            toast.success(`User added to ${role.name} role`);
        },
    });

    const removeUserMutation = useMutation({
        mutationFn: removeUserFromRole,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['user-roles'] });
            toast.success(`User removed from ${role.name} role`);
        },
    });

    const filteredUsers = role.users?.filter((user: any) =>
        user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false
    );

    const handleAddUser = (userId: string) => {
        addUserMutation.mutate({ roleId: role.id, userId });
    };

    const handleRemoveUser = (userId: string) => {
        removeUserMutation.mutate({ roleId: role.id, userId });
    };

    return (
        <div className="space-y-4">
            {role.canManage === false && (
                <div className="rounded-md bg-muted/50 border border-border p-3 text-sm text-muted-foreground">
                    You cannot add or remove users for this role. You can only manage roles below your highest role.
                </div>
            )}
            <div className="flex w-full gap-2 items-center">
                <Input
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-lg flex-shrink"
                />
                <Button
                    className="w-72"
                    variant="secondary"
                    onClick={() => handleAddUser("new-user-id")}
                    disabled={role.canManage === false}
                >
                    <ShieldPlus size={18} className="mr-2" />
                    Assign Role
                </Button>
            </div>
            <ScrollArea className="h-[calc(100vh-20rem)]">
                <div className="space-y-2">
                    {filteredUsers?.map((user: any) => (
                        <div key={user.id} className="px-4 py-2 hover:bg-secondary/15 rounded-md flex items-center justify-between">
                            <Link href={`/admin/users/${user.id}`} className="flex items-center gap-2">
                                <Avatar>
                                    <AvatarImage src={user.image} />
                                    <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <p className="font-medium">{user.name}</p>
                            </Link>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        disabled={role.canManage === false}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Remove User from Role</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Are you sure you want to remove {user.name} from the {role.name} role? This action cannot be undone.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleRemoveUser(user.id)}>Remove</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    ))}
                </div>
            </ScrollArea>
        </div>
    );
}