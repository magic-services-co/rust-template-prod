import React from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'
import { FormField, FormItem, FormControl, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { SortableStepProps, FormValues } from './types'
import { useFieldArray } from 'react-hook-form'
import { SortableField } from './sortable-field'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useDroppable } from '@dnd-kit/core'

export function SortableStep({ id, stepIndex, control, removeStep }: SortableStepProps) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id })

    const { fields, append, remove, move } = useFieldArray({
        control,
        name: `steps.${stepIndex}.fields` as const,
    })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    }

    return (
        <div ref={setNodeRef} style={style} className="mb-6 p-4 border rounded-lg">
            <div className="flex items-center mb-4 space-x-4">
                <div {...attributes} {...listeners}>
                    <GripVertical className="cursor-move" />
                </div>
                <FormField
                    control={control}
                    name={`steps.${stepIndex}.name`}
                    render={({ field }) => (
                        <FormItem className="flex-grow">
                            <FormControl>
                                <Input {...field} placeholder="Step Name" className="text-lg font-semibold" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <Button type="button" variant="destructive" onClick={() => removeStep(stepIndex)}>
                    Remove Step
                </Button>
            </div>
            <SortableContext items={fields.map((_, index) => `${stepIndex}-${index}`)} strategy={verticalListSortingStrategy}>
                {fields.map((field, fieldIndex) => (
                    <SortableField
                        key={field.id}
                        id={`${stepIndex}-${fieldIndex}`}
                        stepIndex={stepIndex}
                        fieldIndex={fieldIndex}
                        control={control}
                        remove={remove}
                    />
                ))}
            </SortableContext>
            <Button
                type="button"
                onClick={() => append({ label: '', key: '', type: 'string', required: false })}
                className="mt-4"
            >
                Add Field
            </Button>
        </div>
    )
}
