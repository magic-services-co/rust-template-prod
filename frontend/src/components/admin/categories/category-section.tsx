import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
import { useState } from 'react'
import { Category } from '@/types/category'
import { ServerCard } from '@/components/admin/servers/server/server-card'
import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable'
import { EditCategoryForm } from '../servers/edit-category-form'

interface CategorySectionProps {
    category: Category
    onDeleteCategory: (id: number) => void
    isDragging?: boolean
}

export function CategorySection({ category, onDeleteCategory, isDragging }: CategorySectionProps) {
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging: isSortableDragging,
    } = useSortable({ id: category.id.toString(), data: { type: 'category' } })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    }

    const handleDelete = () => {
        onDeleteCategory(category.id)
        setIsDialogOpen(false)
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            className={`transition-shadow ${isDragging ? 'shadow-lg' : 'shadow-none'}`}
        >
            <div className="flex items-center justify-between mb-4 p-4 rounded bg-card">
                <div className="flex items-center">
                    <span {...listeners} className="mr-2 cursor-move">
                        <GripVertical size={20} />
                    </span>
                    <h3 className="text-lg font-semibold">{category.name}</h3>
                </div>
                <div className="flex items-center gap-2">
                    <EditCategoryForm
                        categoryId={category.id}
                        initialName={category.name}
                    />
                    <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-accent-foreground">
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete the category
                                    and remove all servers associated with it.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </div>
            <SortableContext
                items={category.servers.map(server => server.server_id)}
                strategy={rectSortingStrategy}
            >
                <div className="px-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {category.servers.map((server) => (
                        <ServerCard
                            key={server.server_id}
                            server={server}
                        />
                    ))}
                </div>
            </SortableContext>
        </div>
    )
}
