"use client"

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { backendApi } from '@/lib/api'
import { getAuthToken } from '@/lib/laravel-auth'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Pencil } from 'lucide-react'
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form'

const formSchema = z.object({
    name: z.string().min(1, 'Category name is required').max(50, 'Category name must be 50 characters or less'),
})

type FormValues = z.infer<typeof formSchema>

interface EditCategoryFormProps {
    categoryId: number
    initialName: string
}

export function EditCategoryForm({ categoryId, initialName }: EditCategoryFormProps) {
    const [isOpen, setIsOpen] = useState(false)
    const queryClient = useQueryClient()

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: initialName,
        },
    })

    const updateCategoryMutation = useMutation({
        mutationFn: async (data: { id: number; name: string }) => {
            const token = getAuthToken();
            const headers: Record<string, string> = { 'Content-Type': 'application/json', Accept: 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;
            const response = await fetch(backendApi('admin/categories'), {
                method: 'PUT',
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
        onSuccess: (data) => {
            if (data.success) {
                queryClient.invalidateQueries({ queryKey: ['categories'] })
                toast.success('Category updated successfully')
                setIsOpen(false)
                form.reset()
            } else {
                toast.error('Failed to update category')
            }
        },
        onError: (error) => {
            toast.error(error.message || `Failed to complete request`)
        },
    })

    function onSubmit(values: FormValues) {
        updateCategoryMutation.mutate({ id: categoryId, name: values.name })
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon">
                    <Pencil className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Edit Category</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Category Name</FormLabel>
                                    <FormControl>
                                        <Input {...field} placeholder="Enter category name" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button type="submit" disabled={updateCategoryMutation.isPending}>
                            {updateCategoryMutation.isPending ? 'Updating...' : 'Update Category'}
                        </Button>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
