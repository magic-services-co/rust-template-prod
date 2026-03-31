"use client"

import { useState, useEffect, useRef } from 'react'
import { backendApi } from '@/lib/api'
import { getAuthToken } from '@/lib/laravel-auth'
import { useForm } from 'react-hook-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from "sonner"
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { GripVertical, Loader2, Pencil } from 'lucide-react'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Label } from "@/components/ui/label"
import { Skeleton } from '@/components/ui/skeleton'
import Image from 'next/image'

interface Column {
    id: number;
    columnKey: string;
    columnLabel: string;
    order: number;
    icon?: string;
}

interface Tab {
    id: number;
    tabKey: string;
    tabLabel: string;
    columns: Column[];
    order: number;
}

interface ColumnChange {
    type: 'add' | 'update' | 'delete' | 'reorder';
    tabKey: string;
    column: Column;
    oldColumnKey?: string;
}

const fetchTabs = async (): Promise<Tab[]> => {
    const token = getAuthToken();
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const response = await fetch(backendApi('admin/leaderboard-settings'), { credentials: 'include', headers });
    if (!response.ok) {
        if (response.status === 401) {
            throw new Error("You are not authorized to do this.")
        }
        throw new Error('Failed to complete request');
    }
    return response.json();
};

const saveTabs = async (data: { 
    tabs: Tab[], 
    deletedTabKeys: string[], 
    deletedColumnKeys: string[],
    columnChanges: ColumnChange[]
}): Promise<void> => {
    const token = getAuthToken();
    const headers: Record<string, string> = { 'Content-Type': 'application/json', Accept: 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const response = await fetch(backendApi('admin/leaderboard-settings'), {
        method: 'POST',
        credentials: 'include',
        headers,
        body: JSON.stringify(data),
    });
    if (!response.ok) {
        if (response.status === 401) {
            throw new Error("You are not authorized to do this.")
        }
        console.log(await response.json())
        throw new Error('Failed to complete request');
    }
};

function SortableColumn({ column, removeColumn, editColumn }: {
    column: Column;
    removeColumn: (columnKey: string) => void;
    editColumn: (column: Column) => void;
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: column.columnKey });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <li
            ref={setNodeRef}
            style={style}
            {...attributes}
            className="flex items-center bg-secondary/30 p-2 rounded"
        >
            <div {...listeners} className="mr-2 cursor-move">
                <GripVertical size={20} />
            </div>
            <div className="flex-grow flex items-center gap-1">
                {column.icon ? (
                    <Image
                        src={column.icon.includes('http') ? column.icon : `/images/icons/${column.icon}`}
                        alt={column.columnKey}
                        width={24}
                        height={24}
                        className="mr-2"
                    />
                ) : null}
                <span>{column.columnLabel} ({column.columnKey})</span>
            </div>
            <Button onClick={() => editColumn(column)} variant="secondary" size="sm" className="mr-2">
                <Pencil size={16} />
            </Button>
            <Button onClick={() => removeColumn(column.columnKey)} variant="destructive" size="sm">Remove</Button>
        </li>
    );
}

function LeaderboardColumnsSkeleton() {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <Skeleton className="h-8 w-[200px]" />
                <Skeleton className="h-10 w-[120px]" />
            </CardHeader>
            <CardContent>
                <Skeleton className="h-10 w-full mb-4" />
                <ul className="mt-4 space-y-2">
                    {[1, 2, 3, 4].map((i) => (
                        <li key={i} className="flex items-center bg-secondary/30 p-2 rounded">
                            <Skeleton className="h-5 w-5 mr-2" />
                            <Skeleton className="h-5 w-[200px] flex-grow mr-2" />
                            <Skeleton className="h-8 w-[40px] mr-2" />
                            <Skeleton className="h-8 w-[80px]" />
                        </li>
                    ))}
                </ul>
                <Skeleton className="h-10 w-[120px] mt-4" />
            </CardContent>
        </Card>
    )
}

export function LeaderboardColumnsForm() {
    const [isModalOpen, setIsModalOpen] = useState(false)
    const queryClient = useQueryClient()
    const [selectedTab, setSelectedTab] = useState<string>('')
    const [localTabs, setLocalTabs] = useState<Tab[]>([])
    const [deletedTabKeys, setDeletedTabKeys] = useState<string[]>([])
    const [deletedColumnKeys, setDeletedColumnKeys] = useState<string[]>([])
    const [hasChanges, setHasChanges] = useState(false)
    const [editingColumn, setEditingColumn] = useState<Column | null>(null)
    const { register, handleSubmit, reset, setValue } = useForm<Omit<Column, 'id' | 'order'>>()
    
    const columnChangesRef = useRef<ColumnChange[]>([])
    const originalTabsRef = useRef<Tab[]>([])

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const { data: tabs, isLoading, isError } = useQuery({
        queryKey: ['leaderboardTabs'],
        queryFn: fetchTabs,
    })

    useEffect(() => {
        if (tabs) {
            setLocalTabs(tabs)
            originalTabsRef.current = JSON.parse(JSON.stringify(tabs))
            if (tabs && !tabs.some((tab) => tab.tabKey === selectedTab)) {
                setSelectedTab(tabs[0]?.tabKey || '')
            }
        }
    }, [tabs, selectedTab])

    const mutation = useMutation({
        mutationFn: saveTabs,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['leaderboardTabs'] })
            toast.success("Columns updated successfully")
            setDeletedTabKeys([])
            setDeletedColumnKeys([])
            setHasChanges(false)
            columnChangesRef.current = []
            originalTabsRef.current = JSON.parse(JSON.stringify(localTabs))
        },
        onError: (error) => {
            toast.error(error.message || "Failed to update columns")
        }
    })

    const onSubmit = (data: Omit<Column, 'id' | 'order'>) => {
        if (localTabs) {
            const updatedTabs = localTabs.map(tab => {
                if (tab.tabKey === selectedTab) {
                    if (editingColumn) {
                        const updatedColumns = tab.columns.map(col =>
                            col.id === editingColumn.id ? { ...col, ...data } : col
                        );
                        
                        columnChangesRef.current.push({
                            type: 'update',
                            tabKey: tab.tabKey,
                            column: { ...editingColumn, ...data },
                            oldColumnKey: editingColumn.columnKey
                        });
                        
                        return { ...tab, columns: updatedColumns };
                    } else {
                        const newColumn: Column = {
                            id: Date.now(),
                            ...data,
                            order: tab.columns.length,
                        };
                        
                        columnChangesRef.current.push({
                            type: 'add',
                            tabKey: tab.tabKey,
                            column: newColumn
                        });
                        
                        return { ...tab, columns: [...tab.columns, newColumn] };
                    }
                }
                return tab;
            });
            setLocalTabs(updatedTabs);
            setHasChanges(true);
        }
        reset();
        setIsModalOpen(false);
        setEditingColumn(null);
    }

    const removeColumn = (columnKey: string) => {
        const updatedTabs = localTabs.map(tab => {
            if (tab.tabKey === selectedTab) {
                const columnToRemove = tab.columns.find(col => col.columnKey === columnKey);
                if (columnToRemove) {
                    columnChangesRef.current.push({
                        type: 'delete',
                        tabKey: tab.tabKey,
                        column: columnToRemove
                    });
                }
                return { ...tab, columns: tab.columns.filter(col => col.columnKey !== columnKey) };
            }
            return tab;
        });
        setLocalTabs(updatedTabs);
        setDeletedColumnKeys([...deletedColumnKeys, columnKey]);
        setHasChanges(true);
    }

    const editColumn = (column: Column) => {
        setEditingColumn(column);
        setValue('columnLabel', column.columnLabel);
        setValue('columnKey', column.columnKey);
        setValue('icon', column.icon || '');
        setIsModalOpen(true);
    }

    const handleDragEnd = (event: any) => {
        const { active, over } = event;
        if (active.id !== over.id) {
            const updatedTabs = localTabs.map(tab => {
                if (tab.tabKey === selectedTab) {
                    const oldIndex = tab.columns.findIndex((col) => col.columnKey === active.id);
                    const newIndex = tab.columns.findIndex((col) => col.columnKey === over.id);
                    
                    if (oldIndex !== newIndex) {
                        const reorderedColumns = arrayMove(tab.columns, oldIndex, newIndex);
                        
                        columnChangesRef.current.push({
                            type: 'reorder',
                            tabKey: tab.tabKey,
                            column: reorderedColumns[newIndex]
                        });
                        
                        return { ...tab, columns: reorderedColumns };
                    }
                }
                return tab;
            });
            setLocalTabs(updatedTabs);
            setHasChanges(true);
        }
    }

    const saveChanges = () => {
        mutation.mutate({
            tabs: localTabs,
            deletedTabKeys,
            deletedColumnKeys,
            columnChanges: columnChangesRef.current
        });
    }

    if (isLoading) return <LeaderboardColumnsSkeleton />
    if (isError) return <div>Error loading tabs</div>

    const selectedTabData = localTabs.find(tab => tab.tabKey === selectedTab);

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Leaderboard Columns</CardTitle>
                <Dialog open={isModalOpen} onOpenChange={(open) => {
                    setIsModalOpen(open);
                    if (!open) setEditingColumn(null);
                }}>
                    <DialogTrigger asChild>
                        <Button>Add Column</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editingColumn ? 'Edit Column' : 'Add New Column'}</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="columnLabel">Column Label</Label>
                                <Input id="columnLabel" {...register('columnLabel')} placeholder="Column Label" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="columnKey">Column Key</Label>
                                <Input id="columnKey" {...register('columnKey')} placeholder="Column Key" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="icon">Icon (optional)</Label>
                                <Input id="icon" {...register('icon')} placeholder="Icon name or class" />
                            </div>
                            <Button type="submit">{editingColumn ? 'Update Column' : 'Add Column'}</Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </CardHeader>
            <CardContent>
                <Select onValueChange={setSelectedTab} value={selectedTab}>
                    <SelectTrigger className="w-full mb-4">
                        <SelectValue placeholder="Select a tab" />
                    </SelectTrigger>
                    <SelectContent>
                        {localTabs.map(tab => (
                            <SelectItem key={tab.tabKey} value={tab.tabKey}>
                                {tab.tabLabel}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {selectedTabData && (
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext
                            items={selectedTabData.columns.map(col => col.columnKey)}
                            strategy={verticalListSortingStrategy}
                        >
                            <ul className="mt-4 space-y-2">
                                {selectedTabData.columns.map((column) => (
                                    <SortableColumn
                                        key={column.columnKey}
                                        column={column}
                                        removeColumn={removeColumn}
                                        editColumn={editColumn}
                                    />
                                ))}
                            </ul>
                        </SortableContext>
                    </DndContext>
                )}
                {hasChanges || mutation.isPending ? (
                    <Button
                        onClick={saveChanges}
                        className="mt-4"
                        disabled={mutation.isPending}
                    >
                        {mutation.isPending ? <Loader2 className="animate-spin" /> : "Save Changes"}
                    </Button>
                ) : null}
            </CardContent>
        </Card>
    )
}
