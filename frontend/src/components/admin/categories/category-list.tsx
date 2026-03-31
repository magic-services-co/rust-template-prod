"use client"

import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { getCategories } from '@/app/actions/admin'
import { backendApi } from '@/lib/api'
import { getAuthToken } from '@/lib/laravel-auth'
import { toast } from 'sonner'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent, DragStartEvent, DragOverlay } from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CategorySection } from './category-section'
import { restrictToWindowEdges } from '@dnd-kit/modifiers'
import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ServerCard } from '@/components/admin/servers/server/server-card'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardHeader, CardContent } from '@/components/ui/card'

export function CategoryList() {
    const queryClient = useQueryClient()
    const { data: categories, isLoading, isError } = useQuery({
        queryKey: ['categories'],
        queryFn: async () => {
            const result = await getCategories();
            if (result.error) {
                throw new Error(result.error);
            }
            return result.data;
        },
    })

    const [activeId, setActiveId] = useState<string | null>(null)
    const [activeType, setActiveType] = useState<'category' | 'server' | null>(null)

    function authHeaders(): Record<string, string> {
        const token = getAuthToken()
        const h: Record<string, string> = { Accept: 'application/json' }
        if (token) h['Authorization'] = `Bearer ${token}`
        return h
    }

    const reorderCategoriesMutation = useMutation({
        mutationFn: async (newOrder: { id: number; order: number }[]) => {
            const response = await fetch(backendApi('admin/categories/reorder'), {
                method: 'POST',
                credentials: 'include',
                headers: { ...authHeaders(), 'Content-Type': 'application/json' },
                body: JSON.stringify({ newOrder }),
            })
            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error("You are not authorized to do this.")
                }
                throw new Error('Failed to complete request');
            }
            return response.json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'] })
            toast.success('Categories reordered successfully')
        },
        onError: (error: Error) => {
            toast.error(error.message || `Failed to complete request`)
        },
    })

    const deleteCategoryMutation = useMutation({
        mutationFn: async (id: number) => {
            const response = await fetch(backendApi(`admin/categories/${id}`), {
                method: 'DELETE',
                credentials: 'include',
                headers: authHeaders(),
            })
            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error("You are not authorized to do this.")
                }
                throw new Error('Failed to complete request');
            }
            return response.json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['fetch-server-list'] })
            queryClient.invalidateQueries({ queryKey: ['categories'] })
            queryClient.invalidateQueries({ queryKey: ['serverData'] })
            toast.success('Category deleted successfully')
        },
        onError: (error: Error) => {
            toast.error(error.message || `Failed to complete request`)
        },
    })

    const reorderServersMutation = useMutation({
        mutationFn: async ({ categoryId, serverIds }: { categoryId: number, serverIds: string[] }) => {
            const response = await fetch(backendApi('admin/servers/reorder'), {
                method: 'POST',
                credentials: 'include',
                headers: { ...authHeaders(), 'Content-Type': 'application/json' },
                body: JSON.stringify({ categoryId, serverIds }),
            })
            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error("You are not authorized to do this.")
                }
                throw new Error('Failed to complete request');
            }
            return response.json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'] })
            toast.success('Servers reordered successfully')
        },
        onError: (error: Error) => {
            toast.error(error.message || `Failed to complete request`)
        },
    })

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    )

    if (isLoading) return <CategoryListSkeleton />
    if (isError) return <div>Error loading categories</div>

    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event
        setActiveId(active.id.toString())
        setActiveType(active.data.current?.type || null)
    }

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event

        setActiveId(null)
        setActiveType(null)

        if (!over) return

        if (active.id === over.id) return

        const isServer = active.data.current?.type === 'server'
        const isOverServer = over.data.current?.type === 'server'
        const isOverCategory = over.data.current?.type === 'category'

        if (isServer) {
            const activeServerId = active.id.toString()
            const activeCategory = categories!.find(category =>
                category.servers.some(server => server.server_id === activeServerId)
            )

            if (isOverServer) {
                const overServerId = over.id.toString()
                const overCategory = categories!.find(category =>
                    category.servers.some(server => server.server_id === overServerId)
                )

                if (activeCategory && overCategory) {
                    const newCategories = categories!.map(category => {
                        if (category.id === activeCategory.id) {
                            const newServers = category.servers.filter(server => server.server_id !== activeServerId)
                            if (category.id === overCategory.id) {
                                const activeServer = category.servers.find(server => server.server_id === activeServerId)!
                                const overIndex = category.servers.findIndex(server => server.server_id === overServerId)
                                newServers.splice(overIndex, 0, activeServer)
                            }
                            return { ...category, servers: newServers }
                        }
                        if (category.id === overCategory.id && category.id !== activeCategory.id) {
                            const newServers = [...category.servers]
                            const overIndex = newServers.findIndex(server => server.server_id === overServerId)
                            const activeServer = activeCategory.servers.find(server => server.server_id === activeServerId)!
                            newServers.splice(overIndex, 0, activeServer)
                            return { ...category, servers: newServers }
                        }
                        return category
                    })

                    queryClient.setQueryData(['categories'], newCategories)
                    reorderServersMutation.mutate({
                        categoryId: overCategory.id,
                        serverIds: newCategories.find(cat => cat.id === overCategory.id)!.servers.map(server => server.server_id)
                    })
                }
            } else if (isOverCategory) {
                const overCategoryId = parseInt(over.id.toString())
                const overCategory = categories!.find(category => category.id === overCategoryId)

                if (activeCategory && overCategory) {
                    const newCategories = categories!.map(category => {
                        if (category.id === activeCategory.id) {
                            return {
                                ...category,
                                servers: category.servers.filter(server => server.server_id !== activeServerId)
                            }
                        }
                        if (category.id === overCategory.id) {
                            const activeServer = activeCategory.servers.find(server => server.server_id === activeServerId)!
                            return {
                                ...category,
                                servers: [...category.servers, activeServer]
                            }
                        }
                        return category
                    })

                    queryClient.setQueryData(['categories'], newCategories)
                    reorderServersMutation.mutate({
                        categoryId: overCategory.id,
                        serverIds: newCategories.find(cat => cat.id === overCategory.id)!.servers.map(server => server.server_id)
                    })
                }
            }
        } else {
            const oldIndex = categories!.findIndex((cat) => cat.id.toString() === active.id)
            const newIndex = categories!.findIndex((cat) => cat.id.toString() === over.id)

            if (oldIndex !== -1 && newIndex !== -1) {
                const newCategories = arrayMove(categories!, oldIndex, newIndex)
                queryClient.setQueryData(['categories'], newCategories)
                reorderCategoriesMutation.mutate(newCategories.map((cat, index) => ({ id: cat.id, order: index })))
            }
        }
    }

    const handleDeleteCategory = (id: number) => {
        deleteCategoryMutation.mutate(id)
    }

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            modifiers={[restrictToWindowEdges]}
        >
            <SortableContext
                items={categories!.map(cat => cat.id.toString())}
                strategy={verticalListSortingStrategy}
            >
                <AnimatePresence>
                    <motion.div layout className="space-y-8">
                        {categories?.map((category) => (
                            <CategorySection
                                key={category.id}
                                category={category}
                                onDeleteCategory={handleDeleteCategory}
                            />
                        ))}
                    </motion.div>
                </AnimatePresence>
            </SortableContext>
            <DragOverlay>
                {activeId && activeType === 'category' && (
                    <CategorySection
                        category={categories!.find(cat => cat.id.toString() === activeId)!}
                        onDeleteCategory={handleDeleteCategory}
                        isDragging
                    />
                )}
                {activeId && activeType === 'server' && (
                    <ServerCard
                        server={categories!.flatMap(cat => cat.servers).find(server => server.server_id === activeId)!}
                        isDragging
                    />
                )}
            </DragOverlay>
        </DndContext>
    )
}

function CategoryListSkeleton() {
    return (
        <div className="space-y-8">
            {[1, 2, 3].map((categoryIndex) => (
                <Card key={categoryIndex}>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <Skeleton className="h-8 w-[200px]" />
                        <div className="flex space-x-2">
                            <Skeleton className="h-10 w-10" />
                            <Skeleton className="h-10 w-10" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {[1, 2, 3, 4].map((serverIndex) => (
                                <Card key={serverIndex}>
                                    <CardContent className="p-4">
                                        <div className="flex items-center space-x-4">
                                            <Skeleton className="h-12 w-12 rounded-full" />
                                            <div className="space-y-2">
                                                <Skeleton className="h-4 w-[150px]" />
                                                <Skeleton className="h-4 w-[100px]" />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}
