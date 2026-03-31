"use client";

import { useState } from "react";
import { backendApi } from "@/lib/api";
import { getAuthToken } from "@/lib/laravel-auth";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusCircle } from "lucide-react";
import { toast } from "sonner";

interface AddRoleFormData {
    name: string;
}

export function AddRoleForm() {
    const [isOpen, setIsOpen] = useState(false);
    const queryClient = useQueryClient();
    const { register, handleSubmit, reset, formState: { errors } } = useForm<AddRoleFormData>();

    const addRoleMutation = useMutation({
        mutationFn: async (data: AddRoleFormData) => {
            const token = getAuthToken();
            const headers: Record<string, string> = { 'Content-Type': 'application/json', Accept: 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;
            const response = await fetch(backendApi('admin/settings/roles'), {
                method: 'POST',
                credentials: 'include',
                headers,
                body: JSON.stringify(data),
            });
            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error("You are not authorized to do this.");
                }
                const errBody = await response.json().catch(() => ({})) as { error?: string; message?: string };
                const message = errBody.error ?? errBody.message ?? `Request failed (${response.status})`;
                throw new Error(message);
            }
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['user-roles'] });
            toast.success("Role added successfully");
            reset();
            setIsOpen(false);
        },
        onError: (error) => {
            toast.error(error.message || `Failed to complete request`)
        },
    });

    const onSubmit = (data: AddRoleFormData) => {
        addRoleMutation.mutate(data);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button className="w-full" variant="outline">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Role
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add New Role</DialogTitle>
                    <DialogDescription>
                        Enter a name for the new role.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="grid gap-4 py-4">
                        <div className="flex flex-col items-start gap-4">
                            <Label htmlFor="name" className="text-right">
                                Name
                            </Label>
                            <Input
                                id="name"
                                className="col-span-3"
                                {...register("name", { required: "Role name is required" })}
                            />
                        </div>
                        {errors.name && (
                            <p className="text-sm text-destructive">{errors.name.message}</p>
                        )}
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={addRoleMutation.isPending}>
                            {addRoleMutation.isPending ? "Adding..." : "Add Role"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
