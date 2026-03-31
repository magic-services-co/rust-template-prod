"use client"

import { backendApi } from "@/lib/api"
import { getAuthToken } from "@/lib/laravel-auth"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect } from "react"

import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Switch } from "@/components/ui/switch"

const storeSaleSchema = z.object({
    enabled: z.boolean(),
    title: z.string().optional(),
    description: z.string().optional(),
    url: z.string().optional(),
})

export type StoreSaleFormValues = z.infer<typeof storeSaleSchema>

export function StoreSaleForm() {
    const queryClient = useQueryClient()

    const { data: initialData, isLoading: isLoadingInitialData, isError, error } = useQuery({
        queryKey: ['storeSale'],
        queryFn: async () => {
            const token = getAuthToken()
            const headers: Record<string, string> = { Accept: "application/json" }
            if (token) headers["Authorization"] = `Bearer ${token}`
            const response = await fetch(backendApi("admin/store-sale"), { credentials: "include", headers })
            if (!response.ok) {
                throw new Error("Failed to fetch store sale data")
            }
            return response.json()
        },
    })

    const form = useForm<StoreSaleFormValues>({
        resolver: zodResolver(storeSaleSchema),
        defaultValues: {
            enabled: false,
            title: "",
            description: "",
            url: "",
        },
    })

    useEffect(() => {
        if (initialData) {
            form.reset(initialData)
        }
    }, [initialData, form])

    const mutation = useMutation({
        mutationFn: async (data: StoreSaleFormValues) => {
            const token = getAuthToken()
            const headers: Record<string, string> = { "Content-Type": "application/json", Accept: "application/json" }
            if (token) headers["Authorization"] = `Bearer ${token}`
            const response = await fetch(backendApi("admin/store-sale"), {
                method: "POST",
                headers,
                credentials: "include",
                body: JSON.stringify(data),
            })
            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error("You are not authorized to update store sale settings.")
                }
                throw new Error("Failed to update store sale settings")
            }
            return response.json()
        },
        onSuccess: () => {
            toast.success("Store sale settings have been successfully updated.")
            queryClient.invalidateQueries({ queryKey: ["storeSale"] })
        },
        onError: (error) => {
            toast.error(error.message || "Failed to update store sale settings. Please try again.")
        },
    })

    function onSubmit(data: StoreSaleFormValues) {
        mutation.mutate(data)
    }

    if (isError) {
        return <FormError error={error as Error} />
    }

    if (isLoadingInitialData) {
        return <div>Loading...</div>
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <FormField
                    control={form.control}
                    name="enabled"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                                <FormLabel className="text-base">
                                    Enable Sale Message
                                </FormLabel>
                                <FormDescription>
                                    Turn the sale message on or off.
                                </FormDescription>
                            </div>
                            <FormControl>
                                <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                />
                            </FormControl>
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Sale Title</FormLabel>
                            <FormControl>
                                <Input {...field} />
                            </FormControl>
                            <FormDescription>
                                The title of your current store sale (optional).
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Sale Description</FormLabel>
                            <FormControl>
                                <Input {...field} />
                            </FormControl>
                            <FormDescription>
                                A brief description of the sale (optional).
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="url"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Sale URL</FormLabel>
                            <FormControl>
                                <Input {...field} />
                            </FormControl>
                            <FormDescription>
                                When the sale is clicked, the page will redirect to this URL.
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <Button type="submit" disabled={mutation.isPending}>
                    {mutation.isPending ? "Updating..." : "Update Store Sale"}
                </Button>
            </form>
        </Form>
    )
}

function FormError({ error }: { error: Error }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Store Sale Settings</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-destructive">{error.message}</p>
            </CardContent>
        </Card>
    )
}
