'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { backendApi } from '@/lib/api'
import { getAuthToken } from '@/lib/laravel-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { toast } from 'sonner'

interface CategoryFormData {
    name: string
    order: number
}

export function AddCategoryForm() {
    const [open, setOpen] = useState(false)
    const router = useRouter()
    const queryClient = useQueryClient()
    const { register, handleSubmit, reset } = useForm<CategoryFormData>()

    const mutation = useMutation({
        mutationFn: async (data: CategoryFormData) => {
            const token = getAuthToken();
            const headers: Record<string, string> = { 'Content-Type': 'application/json', Accept: 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;
            const response = await fetch(backendApi('admin/categories'), {
                method: 'POST',
                credentials: 'include',
                headers,
                body: JSON.stringify(data),
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
            reset()
            setOpen(false)
            queryClient.invalidateQueries({ queryKey: ['fetch-server-list'] })
            queryClient.invalidateQueries({ queryKey: ['categories'] })
            queryClient.invalidateQueries({ queryKey: ['serverData'] })
            toast.success('Category added successfully')
            router.refresh()
        },
        onError: (error) => {
            toast.error(error.message || `Failed to complete request`)
        },
    })

    const onSubmit = (data: CategoryFormData) => {
        mutation.mutate(data)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>Add Category</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add New Category</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <Input
                        {...register('name', { required: true })}
                        type="text"
                        placeholder="Category Name"
                    />
                    <Input
                        {...register('order', { required: true, valueAsNumber: true })}
                        type="number"
                        placeholder="Order"
                    />
                    <Button type="submit" disabled={mutation.isPending}>
                        {mutation.isPending ? 'Adding...' : 'Add Category'}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    )
}
