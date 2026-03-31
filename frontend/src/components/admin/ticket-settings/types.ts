import type { Control } from 'react-hook-form'
import type { FormValues } from './category-manager'

export type { FormValues }

export type FieldType = 'string' | 'number' | 'boolean' | 'enum' | 'date' | 'textarea' | 'players' | 'server' | 'server-grid' | 'players-grid'

export interface SortableFieldProps {
    id: string
    stepIndex: number
    fieldIndex: number
    control: Control<FormValues>
    remove: (index: number) => void
}

export interface SortableStepProps {
    id: string
    stepIndex: number
    control: Control<FormValues>
    removeStep: (index: number) => void
}
