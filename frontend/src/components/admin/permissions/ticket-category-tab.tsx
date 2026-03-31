"use client";

import { useState, useEffect } from "react";
import { backendApi } from "@/lib/api";
import { getAuthToken } from "@/lib/laravel-auth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Role } from "@/types/user";

interface TicketCategory {
    slug: string;
    name: string;
    description?: string;
}

interface TicketCategoryTabProps {
    role: Role;
}

export function TicketCategoryTab({ role }: TicketCategoryTabProps) {
    const queryClient = useQueryClient();
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [hasChanges, setHasChanges] = useState(false);

    const { data: ticketData, isLoading } = useQuery({
        queryKey: ['role-ticket-categories', role.id],
        queryFn: async () => {
            const token = getAuthToken();
            const headers: Record<string, string> = { Accept: 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;
            const response = await fetch(backendApi(`admin/roles/${role.id}/ticket-categories`), { credentials: 'include', headers });
            if (!response.ok) {
                throw new Error('Failed to fetch ticket categories');
            }
            return response.json();
        },
        enabled: !!role.id,
    });

    const updateTicketCategoriesMutation = useMutation({
        mutationFn: async (categorySlugs: string[]) => {
            const token = getAuthToken();
            const headers: Record<string, string> = { 'Content-Type': 'application/json', Accept: 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;
            const response = await fetch(backendApi(`admin/roles/${role.id}/ticket-categories`), {
                method: 'PUT',
                credentials: 'include',
                headers,
                body: JSON.stringify({ categorySlugs }),
            });
            if (!response.ok) {
                throw new Error('Failed to update ticket categories');
            }
            return response.json();
        },
        onSuccess: () => {
            toast.success('Ticket categories updated successfully');
            setHasChanges(false);
            queryClient.invalidateQueries({ queryKey: ['role-ticket-categories', role.id] });
        },
        onError: (error) => {
            toast.error('Failed to update ticket categories');
            console.error('Error updating ticket categories:', error);
        },
    });

    useEffect(() => {
        if (ticketData?.assignedCategorySlugs) {
            setSelectedCategories(ticketData.assignedCategorySlugs);
            setHasChanges(false);
        }
    }, [ticketData]);

    const handleCategoryToggle = (categorySlug: string, checked: boolean) => {
        const newSelectedCategories = checked
            ? [...selectedCategories, categorySlug]
            : selectedCategories.filter(slug => slug !== categorySlug);
        
        setSelectedCategories(newSelectedCategories);
        setHasChanges(true);
    };

    const handleSelectAll = () => {
        if (ticketData?.allCategories) {
            const allSlugs = ticketData.allCategories.map((cat: TicketCategory) => cat.slug);
            setSelectedCategories(allSlugs);
            setHasChanges(true);
        }
    };

    const handleClearAll = () => {
        setSelectedCategories([]);
        setHasChanges(true);
    };

    const handleSaveChanges = () => {
        updateTicketCategoriesMutation.mutate(selectedCategories);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-32">
                <div className="text-muted-foreground">Loading ticket categories...</div>
            </div>
        );
    }

    const allCategories = ticketData?.allCategories || [];
    const hasAnyCategories = allCategories.length > 0;

    return (
        <div className="space-y-4">
            {role.canManage === false && (
                <div className="rounded-md bg-muted/50 border border-border p-3 text-sm text-muted-foreground mb-2">
                    You cannot edit ticket categories for this role. You can only manage roles below your highest role.
                </div>
            )}
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-muted-foreground">
                        {selectedCategories.length === 0 
                            ? "This role has access to all ticket categories"
                            : `This role has access to ${selectedCategories.length} ticket category${selectedCategories.length !== 1 ? 's' : ''}`
                        }
                    </p>
                </div>
                <div className="flex gap-2">
                    {hasAnyCategories && (
                        <>
                            <Button variant="outline" size="sm" onClick={handleSelectAll} disabled={role.canManage === false}>
                                Select All
                            </Button>
                            <Button variant="outline" size="sm" onClick={handleClearAll} disabled={role.canManage === false}>
                                Clear All
                            </Button>
                        </>
                    )}
                    {hasChanges && role.canManage !== false && (
                        <Button
                            size="sm"
                            onClick={handleSaveChanges}
                            disabled={updateTicketCategoriesMutation.isPending}
                        >
                            {updateTicketCategoriesMutation.isPending ? 'Saving...' : 'Save'}
                        </Button>
                    )}
                </div>
            </div>

            {!hasAnyCategories ? (
                <div className="text-center text-muted-foreground py-8">
                    No ticket categories found. Create some ticket categories first.
                </div>
            ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                    {allCategories.map((category: TicketCategory) => (
                        <div key={category.slug} className="flex items-center space-x-3 p-2 rounded-md hover:bg-secondary/10">
                            <Checkbox
                                id={category.slug}
                                checked={selectedCategories.includes(category.slug)}
                                onCheckedChange={(checked) =>
                                    role.canManage !== false && handleCategoryToggle(category.slug, checked as boolean)
                                }
                                disabled={role.canManage === false}
                            />
                            <div className="flex-1">
                                <Label 
                                    htmlFor={category.slug} 
                                    className="text-sm font-medium cursor-pointer"
                                >
                                    {category.name}
                                </Label>
                                {category.description && (
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        {category.description}
                                    </p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
} 