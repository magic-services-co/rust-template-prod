"use client";

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from "@/components/ui/button";
import { GripVertical } from "lucide-react";

interface Category {
    slug: string;
    name: string;
}

interface SortableCategoryItemProps {
    category: Category;
    isSelected: boolean;
    onSelectCategory: (slug: string) => void;
}

export function SortableCategoryItem({ category, isSelected, onSelectCategory }: SortableCategoryItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: category.slug });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} className="flex items-center space-x-2">
            <div {...attributes} {...listeners} className="cursor-move p-1 hover:bg-secondary rounded">
                <GripVertical className="h-4 w-4 text-muted-foreground" />
            </div>
            <Button
                variant={isSelected ? "default" : "ghost"}
                size={"lg"}
                className="flex-1 !justify-start text-left w-full"
                onClick={() => onSelectCategory(category.slug)}
            >
                {category.name}
            </Button>
        </div>
    );
}
