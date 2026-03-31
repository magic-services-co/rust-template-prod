"use client";

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from "@/components/ui/button";
import { GripVertical } from "lucide-react";
import { Role } from "@/types/user";

interface SortableRoleItemProps {
    role: Role;
    isSelected: boolean;
    onSelectRole: (role: Role) => void;
    /** When false, this role cannot be dragged (at or above current user's highest role). */
    canManage?: boolean;
}

export function SortableRoleItem({ role, isSelected, onSelectRole, canManage = true }: SortableRoleItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: role.id, disabled: !canManage });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} className="flex items-center space-x-2">
            {canManage ? (
                <div {...attributes} {...listeners} className="cursor-move p-1 hover:bg-gray-100 rounded">
                    <GripVertical className="h-4 w-4 text-gray-400" />
                </div>
            ) : (
                <div className="cursor-not-allowed p-1 rounded opacity-50" title="You cannot move roles at or above your highest role.">
                    <GripVertical className="h-4 w-4 text-gray-400" />
                </div>
            )}
            <Button
                variant={isSelected ? "default" : "ghost"}
                className="flex-1 justify-start"
                onClick={() => onSelectRole(role)}
            >
                {role.name}
            </Button>
        </div>
    );
}
