"use client"

import { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import type { NavigationItem } from '@/types/navigation'
import { navigationItemSchema } from '@/types/navigation'
import { backendApi } from '@/lib/api'
import { getAuthToken } from '@/lib/laravel-auth'
import { AddNavigationDialog } from '@/components/admin/add-navigation-dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

function authHeaders(): Record<string, string> {
    const token = getAuthToken();
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
}
async function getNavigationItems(): Promise<NavigationItem[]> {
    const response = await fetch(backendApi("admin/navigation"), { credentials: 'include', headers: authHeaders() });
    if (!response.ok) throw new Error("Failed to fetch navigation items");
    return response.json();
}
async function createNavigationItem(item: Omit<NavigationItem, "id">): Promise<NavigationItem> {
    const response = await fetch(backendApi("admin/navigation"), { method: "POST", credentials: 'include', headers: { ...authHeaders(), "Content-Type": "application/json" }, body: JSON.stringify(item) });
    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(typeof err.message === 'string' ? err.message : err.errors ? Object.values(err.errors).flat().join(', ') : "Failed to create navigation item");
    }
    return response.json();
}
async function deleteNavigationItem(id: string): Promise<void> {
    const response = await fetch(backendApi("admin/navigation"), { method: "DELETE", credentials: 'include', headers: { ...authHeaders(), "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    if (!response.ok) throw new Error("Failed to delete navigation item");
}
async function updateNavigationItem(data: NavigationItem): Promise<NavigationItem> {
    const response = await fetch(backendApi("admin/navigation"), { method: "PUT", credentials: 'include', headers: { ...authHeaders(), "Content-Type": "application/json" }, body: JSON.stringify(data) });
    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(typeof err.message === 'string' ? err.message : err.errors ? Object.values(err.errors).flat().join(', ') : "Failed to update navigation item");
    }
    return response.json();
}
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Loader2, GripVertical, PlusCircle } from 'lucide-react'
import { toast } from 'sonner'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
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
} from "@/components/ui/alert-dialog"

export function NavigationForm() {
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
    const [selectedItem, setSelectedItem] = useState<NavigationItem | null>(null)
    const [hasChanges, setHasChanges] = useState(false)
    const queryClient = useQueryClient()

    const { data: navItems, isLoading } = useQuery<NavigationItem[]>({
        queryKey: ['navigation-items'],
        queryFn: getNavigationItems,
    })

    useEffect(() => {
        if (navItems && selectedItem) {
            const itemSelected = navItems.find((item: NavigationItem) => item.id === selectedItem?.id);
            if (!itemSelected) {
                setSelectedItem(null)
                return;
            } else {
                setSelectedItem(itemSelected)
            }
        }
    }, [navItems, selectedItem])

    const createMutation = useMutation({
        mutationFn: createNavigationItem,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['navigation-items'] })
            setIsAddDialogOpen(false)
            toast.success("Navigation item added")
        },
        onError: (err: Error) => {
            toast.error(err.message || "Failed to add navigation item")
        },
    })

    const deleteMutation = useMutation({
        mutationFn: deleteNavigationItem,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['navigation-items'] }),
    })

    const updateMutation = useMutation({
        mutationFn: updateNavigationItem,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['navigation-items'] }),
    })

    const handleAddItem = (data: z.infer<typeof navigationItemSchema>) => {
        createMutation.mutate({
            label: data.label,
            url: data.url,
            order: Number(data.order) ?? 0,
            hidden: data.hidden ?? false,
        })
    }

    const handleDeleteItem = (id: string) => {
        deleteMutation.mutate(id)
    }

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    )

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event

        if (active.id !== over?.id && navItems) {
            const oldIndex = navItems.findIndex((item: NavigationItem) => item.id === active.id)
            const newIndex = navItems.findIndex((item: NavigationItem) => item.id === over?.id)

            const newOrder = arrayMove(navItems, oldIndex, newIndex)

            newOrder.forEach((item: NavigationItem, index) => {
                updateMutation.mutate({ ...item, order: index })
            })

            queryClient.setQueryData(['navigation-items'], newOrder)
        }
    }

    const form = useForm<NavigationItem>({
        defaultValues: {
            label: '',
            url: '',
            order: 0,
            id: '',
            hidden: false
        }
    });

    useEffect(() => {
        if (selectedItem) {
            form.setValue('label', selectedItem.label);
            form.setValue('url', selectedItem.url);
            form.setValue('order', selectedItem.order);
            form.setValue('id', selectedItem.id);
            form.setValue('hidden', selectedItem.hidden ?? false);
        } else {
            form.reset();
        }
    }, [selectedItem, form]);

    useEffect(() => {
        if (form.formState.isDirty) {
            setHasChanges(true);
        }
    }, [form.formState.isDirty, form]);

    return (
        <div className="flex h-[calc(100vh-4rem)]">
            <Card className="w-1/4 mr-4">
                <CardHeader>
                    <CardTitle>Navigation Items</CardTitle>
                </CardHeader>
                <CardContent>
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext
                            items={navItems?.map(item => ({ id: item.id })) || []}
                            strategy={verticalListSortingStrategy}
                        >
                            <NavigationList
                                items={navItems || []}
                                selectedItem={selectedItem || undefined}
                                onSelectItem={setSelectedItem}
                                setIsAddDialogOpen={setIsAddDialogOpen}
                                onDeleteItem={handleDeleteItem}
                            />
                        </SortableContext>
                    </DndContext>
                </CardContent>
            </Card>

            <Card className="w-3/4">
                <CardHeader>
                    <CardTitle>Navigation Settings</CardTitle>
                </CardHeader>
                <CardContent>
                    {selectedItem ? (
                        <NavigationItemForm item={selectedItem} />
                    ) : null}
                </CardContent>
                <AddNavigationDialog
                    isOpen={isAddDialogOpen}
                    onClose={() => setIsAddDialogOpen(false)}
                    onSubmit={handleAddItem}
                />
            </Card>
        </div>
    )
}

function NavigationItemForm({ item }: { item: NavigationItem }) {
    const queryClient = useQueryClient()
    
    const form = useForm<NavigationItem>({
        defaultValues: {
            label: item.label,
            url: item.url,
            order: item.order,
            id: item.id,
            hidden: item.hidden ?? false
        }
    });

    useEffect(() => {
        form.reset({
            label: item.label,
            url: item.url,
            order: item.order,
            id: item.id,
            hidden: item.hidden ?? false
        });
    }, [item, form]);

    const updateMutation = useMutation({
        mutationFn: updateNavigationItem,
        onSuccess: () => {
            toast.success("Navigation item updated successfully")
            queryClient.invalidateQueries({ queryKey: ['navigation-items'] })
        },
        onError: (err: Error) => {
            toast.error(err.message || "Failed to update navigation item")
        },
    })

    const onSubmit = (data: NavigationItem) => {
        updateMutation.mutate({
            id: item.id,
            label: data.label,
            url: data.url,
            order: Number(data.order) ?? 0,
            hidden: data.hidden ?? false,
        })
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="label"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Label</FormLabel>
                            <FormControl>
                                <Input {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="url"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>URL</FormLabel>
                            <FormControl>
                                <Input {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="order"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Order</FormLabel>
                            <FormControl>
                                <Input
                                    type="number"
                                    min={0}
                                    {...field}
                                    value={field.value ?? ""}
                                    onChange={e => {
                                        const v = e.target.value === "" ? 0 : parseInt(e.target.value, 10);
                                        field.onChange(Number.isNaN(v) ? 0 : v);
                                    }}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="hidden"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                                <FormLabel className="text-base">Hidden</FormLabel>
                                <FormDescription>
                                    Hide this page from the navbar and block access to it. Users will see a 404 page if they try to visit it.
                                </FormDescription>
                            </div>
                            <FormControl>
                                <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                />
                            </FormControl>
                        </FormItem>
                    )}
                />
                <Button type="submit" disabled={updateMutation.isPending}>
                    {updateMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : 'Update'}
                </Button>
            </form>
        </Form>
    )
}

function SortableNavigationItem({ item, onSelect, isSelected, onDelete }: { item: NavigationItem; onSelect: () => void; isSelected: boolean; onDelete: () => void }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: item.id })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    }

    return (
        <Button
            ref={setNodeRef}
            style={style}
            {...attributes}
            variant="ghost"
            size="lg"
            className={`w-full flex items-center px-2 cursor-pointer ${isSelected ? 'bg-accent' : ''}`}
            onClick={onSelect}
        >
            <div className="flex-grow flex items-center">
                <div {...listeners} className="mr-2 cursor-move">
                    <GripVertical size={16} />
                </div>
                <span className="">{item.label}</span>
            </div>
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm" onClick={(e) => e.stopPropagation()}>
                        Delete
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the navigation item.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={(e) => { e.stopPropagation(); onDelete(); }}>
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Button>
    )
}

function NavigationList({ items, selectedItem, onSelectItem, setIsAddDialogOpen, onDeleteItem }: {
    items: NavigationItem[];
    selectedItem?: NavigationItem;
    onSelectItem: (item: NavigationItem) => void;
    setIsAddDialogOpen: (isOpen: boolean) => void;
    onDeleteItem: (id: string) => void;
}) {
    return (
        <div className="space-y-2">
            <Button onClick={() => setIsAddDialogOpen(true)} variant="outline" className="mb-4 w-full">
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Navigation Item
            </Button>
            {items.map((item) => (
                <SortableNavigationItem
                    key={item.id}
                    item={item}
                    onSelect={() => onSelectItem(item)}
                    isSelected={selectedItem?.id === item.id}
                    onDelete={() => onDeleteItem(item.id.toString())}
                />
            ))}
        </div>
    )
}
