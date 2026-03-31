"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { backendApi } from "@/lib/api";
import { getAuthToken } from "@/lib/laravel-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit, Trash2, Eye, Navigation } from "lucide-react";
import { toast } from "sonner";
import { ServerCombobox } from "@/components/admin/server-pages/server-combobox";
import { PageBuilder } from "@/components/admin/server-pages/page-builder";

function authHeaders(): Record<string, string> {
    const token = getAuthToken();
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
}
async function getNavigationItems(): Promise<{ id: string; label: string; url: string; order: number; hidden?: boolean }[]> {
    const response = await fetch(backendApi("admin/navigation"), { credentials: 'include', headers: authHeaders() });
    if (!response.ok) throw new Error("Failed to fetch navigation items");
    return response.json();
}
async function createNavigationItem(item: { label: string; url: string; order: number; hidden?: boolean }): Promise<void> {
    const response = await fetch(backendApi("admin/navigation"), { method: "POST", credentials: 'include', headers: { ...authHeaders(), "Content-Type": "application/json" }, body: JSON.stringify(item) });
    if (!response.ok) throw new Error("Failed to create navigation item");
}
async function deleteNavigationItem(id: string): Promise<void> {
    const response = await fetch(backendApi("admin/navigation"), { method: "DELETE", credentials: 'include', headers: { ...authHeaders(), "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    if (!response.ok) throw new Error("Failed to delete navigation item");
}

interface ServerPage {
    id: string;
    server_id: string;
    server: {
        server_id: string;
        server_name: string;
    };
    title: string;
    slug: string;
    content: any;
    enabled: boolean;
    createdAt: string;
    updatedAt: string;
}

export function ServerPagesManager() {
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [editingPage, setEditingPage] = useState<ServerPage | null>(null);
    const queryClient = useQueryClient();

    const { data: navItems } = useQuery({
        queryKey: ["navigation-items"],
        queryFn: getNavigationItems,
    });

    const { data: pages, isLoading } = useQuery<ServerPage[]>({
        queryKey: ["serverPages"],
        queryFn: async () => {
            const response = await fetch(backendApi("admin/server-pages"), { credentials: 'include', headers: authHeaders() });
            if (!response.ok) throw new Error("Failed to fetch pages");
            return response.json();
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const response = await fetch(backendApi(`admin/server-pages/${id}`), {
                method: "DELETE",
                credentials: 'include',
                headers: authHeaders(),
            });
            if (!response.ok) throw new Error("Failed to delete page");
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["serverPages"] });
            toast.success("Page deleted successfully");
        },
        onError: () => {
            toast.error("Failed to delete page");
        }
    });

    const handleDelete = (id: string) => {
        if (confirm("Are you sure you want to delete this page?")) {
            deleteMutation.mutate(id);
        }
    };

    const handleAddToNavigation = async (page: ServerPage) => {
        try {
            const response = await fetch(backendApi("admin/navigation"), { credentials: 'include', headers: authHeaders() });
            const navItems = await response.json();
            const nextOrder = navItems.length;

            const url = page.server_id 
                ? `/servers/${page.server_id}/${page.slug}`
                : `/${page.slug}`;

            await createNavigationItem({
                label: page.title,
                url: url,
                order: nextOrder,
                hidden: false
            });

            queryClient.invalidateQueries({ queryKey: ["navigation-items"] });
            toast.success("Added to navigation!");
        } catch (error) {
            console.error("Failed to add to navigation:", error);
            toast.error("Failed to add to navigation");
        }
    };

    const handleRemoveFromNavigation = async (page: ServerPage) => {
        try {
            const url = page.server_id 
                ? `/servers/${page.server_id}/${page.slug}`
                : `/${page.slug}`;

            const navItem = navItems?.find((item: any) => item.url === url);
            if (navItem) {
                await deleteNavigationItem(navItem.id);
                queryClient.invalidateQueries({ queryKey: ["navigation-items"] });
                toast.success("Removed from navigation!");
            }
        } catch (error) {
            console.error("Failed to remove from navigation:", error);
            toast.error("Failed to remove from navigation");
        }
    };

    const isInNavigation = (page: ServerPage) => {
        if (!navItems) return false;
        const url = page.server_id 
            ? `/servers/${page.server_id}/${page.slug}`
            : `/${page.slug}`;
        return navItems.some((item: any) => item.url === url);
    };

    if (isLoading) {
        return <div className="animate-pulse space-y-4">
            <div className="h-12 bg-secondary/20 rounded-md" />
            <div className="h-64 bg-secondary/20 rounded-md" />
        </div>;
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Create Page
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Create Server Page</DialogTitle>
                            <DialogDescription>Create a new custom page for a server (e.g., Commands or About Server)</DialogDescription>
                        </DialogHeader>
                        <PageBuilder
                            onSuccess={() => {
                                setIsCreateDialogOpen(false);
                                queryClient.invalidateQueries({ queryKey: ["serverPages"] });
                            }}
                        />
                    </DialogContent>
                </Dialog>
            </div>

            {pages && pages.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <p className="text-muted-foreground">No pages found. Create your first page to get started.</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4">
                    {pages?.map((page) => (
                        <Card key={page.id}>
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div>
                                        <CardTitle className="flex items-center gap-2">
                                            {page.title}
                                            {!page.enabled && (
                                                <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded">
                                                    Disabled
                                                </span>
                                            )}
                                        </CardTitle>
                                <CardDescription>
                                    {page.server_id ? `${page.server?.server_name || 'Server'} • /servers/[server_id]/${page.slug}` : `General Page • /${page.slug}`}
                                </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setEditingPage(page)}
                                    >
                                        <Edit className="mr-2 h-4 w-4" />
                                        Edit
                                    </Button>
                                    {isInNavigation(page) ? (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleRemoveFromNavigation(page)}
                                            title="Remove from navigation menu"
                                            className="text-orange-600"
                                        >
                                            <Navigation className="mr-2 h-4 w-4" />
                                            Remove from Nav
                                        </Button>
                                    ) : (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleAddToNavigation(page)}
                                            title="Add to navigation menu"
                                        >
                                            <Navigation className="mr-2 h-4 w-4" />
                                            Add to Nav
                                        </Button>
                                    )}
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            const url = page.server_id 
                                                ? `/servers/${page.server_id}/${page.slug}`
                                                : `/${page.slug}`;
                                            window.open(url, '_blank');
                                        }}
                                    >
                                        <Eye className="mr-2 h-4 w-4" />
                                        View
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => handleDelete(page.id)}
                                    >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Delete
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {editingPage && (
                <Dialog open={!!editingPage} onOpenChange={(open) => !open && setEditingPage(null)}>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Edit Page</DialogTitle>
                            <DialogDescription>Update the page content</DialogDescription>
                        </DialogHeader>
                        <PageBuilder
                            page={editingPage}
                            onSuccess={() => {
                                setEditingPage(null);
                                queryClient.invalidateQueries({ queryKey: ["serverPages"] });
                            }}
                        />
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}
