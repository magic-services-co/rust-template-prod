"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Role } from "@/types/user";
import { AddRoleForm } from "./add-role-form";
import { SortableRoleItem } from "./sortable-role-item";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import React, { useState } from "react";

interface RoleListProps {
    roles: Role[] | undefined;
    selectedRole: Role | undefined;
    onSelectRole: (role: Role) => void;
    onReorderRoles: (roleIds: string[]) => void;
}

export function RoleList({ roles, selectedRole, onSelectRole, onReorderRoles }: RoleListProps) {
    const [localRoles, setLocalRoles] = useState<Role[]>(roles || []);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (active.id !== over?.id) {
            const oldIndex = localRoles.findIndex((role) => role.id === active.id);
            const newIndex = localRoles.findIndex((role) => role.id === over?.id);

            const newRoles = arrayMove(localRoles, oldIndex, newIndex);
            setLocalRoles(newRoles);
            
            onReorderRoles(newRoles.map(role => role.id));
        }
    };

    React.useEffect(() => {
        if (roles) {
            setLocalRoles(roles);
        }
    }, [roles]);

    return (
        <div className="space-y-4">
            <AddRoleForm />
            <ScrollArea className="h-[calc(100vh-12rem)]">
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext
                        items={localRoles.map(role => role.id)}
                        strategy={verticalListSortingStrategy}
                    >
                        <div className="space-y-2">
                            {localRoles.map((role) => (
                                <SortableRoleItem
                                    key={role.id}
                                    role={role}
                                    isSelected={selectedRole?.id === role.id}
                                    onSelectRole={onSelectRole}
                                    canManage={role.canManage !== false}
                                />
                            ))}
                        </div>
                    </SortableContext>
                </DndContext>
            </ScrollArea>
        </div>
    );
}