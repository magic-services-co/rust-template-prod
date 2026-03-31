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
import { GripVertical, Loader2 } from 'lucide-react'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Skeleton } from '@/components/ui/skeleton'

interface Column {
  columnKey: string;
  columnLabel: string;
  order: number;
}

interface Tab {
  id: number;
  tabKey: string;
  tabLabel: string;
  columns: Column[];
  order: number;
}

interface TabChange {
  type: 'add' | 'update' | 'delete' | 'reorder';
  tab: Tab;
  oldTabKey?: string;
}

interface SaveTabsInput {
  tabs: Tab[];
  deletedTabKeys: string[];
  tabChanges: TabChange[];
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

const saveTabs = async ({ tabs, deletedTabKeys, tabChanges }: SaveTabsInput): Promise<void> => {
  const token = getAuthToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json', Accept: 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const response = await fetch(backendApi('admin/leaderboard-settings'), {
    method: 'POST',
    credentials: 'include',
    headers,
    body: JSON.stringify({ tabs, deletedTabKeys, tabChanges }),
  });
  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("You are not authorized to do this.")
    }
    throw new Error('Failed to complete request');
  }
};

function SortableTab({ tab, removeTab, editTab }: {
  tab: Tab;
  removeTab: (tabKey: string) => void;
  editTab: (tab: Tab) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: tab.tabKey });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      {...attributes}
      className="flex items-center bg-secondary p-2 rounded"
    >
      <div {...listeners} className="mr-2 cursor-move">
        <GripVertical size={20} />
      </div>
      <span className="flex-grow">{tab.tabLabel} ({tab.tabKey})</span>
      <span className="mr-4 text-sm text-muted-foreground">
        {tab.columns.length} column(s)
      </span>
      <div className="flex gap-2">
        <Button onClick={() => editTab(tab)} variant="secondary" size="sm">Edit</Button>
        <Button onClick={() => removeTab(tab.tabKey)} variant="destructive" size="sm">Remove</Button>
      </div>
    </li>
  );
}

function LeaderboardTabsSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <Skeleton className="h-8 w-[200px]" />
        <Skeleton className="h-10 w-[100px]" />
      </CardHeader>
      <CardContent>
        <ul className="mt-4 space-y-2">
          {[1, 2, 3].map((i) => (
            <li key={i} className="flex items-center bg-secondary p-2 rounded">
              <Skeleton className="h-5 w-5 mr-2" />
              <Skeleton className="h-5 w-[200px] flex-grow" />
              <Skeleton className="h-5 w-[100px] mr-4" />
              <Skeleton className="h-8 w-[80px]" />
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

function AddTabDialog({ onSubmit }: {
  onSubmit: (data: Omit<Tab, 'id' | 'columns' | 'order'>) => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const { register, handleSubmit, reset } = useForm<Omit<Tab, 'id' | 'columns' | 'order'>>()

  const handleSubmitAndClose = (data: Omit<Tab, 'id' | 'columns' | 'order'>) => {
    onSubmit(data)
    setIsOpen(false)
    reset()
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>Add Tab</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Tab</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleSubmitAndClose)} className="space-y-4">
          <Input {...register('tabLabel')} placeholder="Tab Label" />
          <Input {...register('tabKey')} placeholder="Tab Key" />
          <Button type="submit">Add Tab</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function EditTabDialog({
  tab,
  onSubmit,
  isOpen,
  setIsOpen
}: {
  tab: Tab | null;
  onSubmit: (data: Omit<Tab, 'id' | 'columns' | 'order'>) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}) {
  const { register, handleSubmit, reset } = useForm<Omit<Tab, 'id' | 'columns' | 'order'>>()

  useEffect(() => {
    if (tab) {
      reset({
        tabLabel: tab.tabLabel,
        tabKey: tab.tabKey,
      })
    }
  }, [tab, reset])

  const handleSubmitAndClose = (data: Omit<Tab, 'id' | 'columns' | 'order'>) => {
    onSubmit(data)
    setIsOpen(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Tab</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleSubmitAndClose)} className="space-y-4">
          <Input {...register('tabLabel')} placeholder="Tab Label" />
          <Input {...register('tabKey')} placeholder="Tab Key" />
          <Button type="submit">Update Tab</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function LeaderboardTabsForm() {
  const [editingTab, setEditingTab] = useState<Tab | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const queryClient = useQueryClient()
  const [localTabs, setLocalTabs] = useState<Tab[]>([])
  const [hasChanges, setHasChanges] = useState(false)
  const [deletedTabKeys, setDeletedTabKeys] = useState<string[]>([])

  const tabChangesRef = useRef<TabChange[]>([])
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
    }
  }, [tabs])

  const mutation = useMutation({
    mutationFn: saveTabs,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaderboardTabs'] });
      setHasChanges(false);
      setDeletedTabKeys([]);
      tabChangesRef.current = []
      originalTabsRef.current = JSON.parse(JSON.stringify(localTabs))
      toast.success("Tabs updated successfully")
    },
    onError: (error) => {
      toast.error(error.message || `Failed to complete request`)
    }
  })

  const handleAddTab = (data: Omit<Tab, 'id' | 'columns' | 'order'>) => {
    if (tabs) {
      const newTab: Tab = {
        id: Date.now(),
        ...data,
        columns: [],
        order: tabs.length,
      }
      
      tabChangesRef.current.push({
        type: 'add',
        tab: newTab
      });
      
      setLocalTabs([...localTabs, newTab])
      setHasChanges(true)
    }
  }

  const handleEditTab = (data: Omit<Tab, 'id' | 'columns' | 'order'>) => {
    if (editingTab) {
      const updatedTab = { ...editingTab, ...data };
      
      tabChangesRef.current.push({
        type: 'update',
        tab: updatedTab,
        oldTabKey: editingTab.tabKey
      });
      
      setLocalTabs(localTabs.map(tab =>
        tab.tabKey === editingTab.tabKey
          ? updatedTab
          : tab
      ))
      setHasChanges(true)
    }
  }

  const openEditDialog = (tab: Tab) => {
    setEditingTab(tab)
    setIsEditDialogOpen(true)
  }

  const removeTab = (tabKey: string) => {
    const tabToRemove = localTabs.find(tab => tab.tabKey === tabKey);
    if (tabToRemove) {
      tabChangesRef.current.push({
        type: 'delete',
        tab: tabToRemove
      });
    }
    
    setLocalTabs(localTabs.filter(tab => tab.tabKey !== tabKey));
    setDeletedTabKeys(prev => [...prev, tabKey]);
    setHasChanges(true);
  }

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (active.id !== over.id && localTabs) {
      const oldIndex = localTabs.findIndex((tab) => tab.tabKey === active.id);
      const newIndex = localTabs.findIndex((tab) => tab.tabKey === over.id);
      
      if (oldIndex !== newIndex) {
        const reorderedTabs = arrayMove(localTabs, oldIndex, newIndex);
        const movedTab = reorderedTabs[newIndex];
        
        tabChangesRef.current.push({
          type: 'reorder',
          tab: movedTab
        });
        
        setLocalTabs(reorderedTabs);
        setHasChanges(true);
      }
    }
  }

  const saveChanges = () => {
    mutation.mutate({ 
      tabs: localTabs, 
      deletedTabKeys,
      tabChanges: tabChangesRef.current
    });
  }

  if (isLoading) return <LeaderboardTabsSkeleton />
  if (isError) return <div>Error loading tabs</div>

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Leaderboard Tabs</CardTitle>
        <AddTabDialog onSubmit={handleAddTab} />
      </CardHeader>
      <CardContent>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={localTabs.map(tab => tab.tabKey)}
            strategy={verticalListSortingStrategy}
          >
            <ul className="mt-4 space-y-2">
              {localTabs.map((tab) => (
                <SortableTab
                  key={tab.tabKey}
                  tab={tab}
                  removeTab={removeTab}
                  editTab={openEditDialog}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
        {hasChanges && (
          <Button
            onClick={saveChanges}
            className="mt-4"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? (
              <Loader2 className="animate-spin h-4 w-4" />
            ) : (
              "Save Changes"
            )}
          </Button>
        )}
      </CardContent>
      <EditTabDialog
        tab={editingTab}
        onSubmit={handleEditTab}
        isOpen={isEditDialogOpen}
        setIsOpen={setIsEditDialogOpen}
      />
    </Card>
  )
}
