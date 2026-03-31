'use client'

import { backendApi } from "@/lib/api"
import { getAuthToken } from "@/lib/laravel-auth"
import { useForm, UseFormReturn, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect } from "react"
import * as React from "react"

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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ColorPicker } from "@/components/ui/color-picker"
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"
import { Switch } from "@/components/ui/switch"

const hexColorRegex = /^#([A-Fa-f0-9]{6})$/;

const discordIntegrationSchema = z.object({
    guildIds: z.array(z.string()),
    clientId: z.string().optional(),
    clientSecret: z.string().optional(),
    botToken: z.string().optional(),
    webhookUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
    verificationHookColor: z.string()
        .regex(hexColorRegex, "Must be a valid hex color code (e.g., #FF0000)")
        .optional(),
    verificationHookEnabled: z.boolean().optional(),
    ticketHookUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
    ticketHookColor: z.string()
        .regex(hexColorRegex, "Must be a valid hex color code (e.g., #FF0000)")
        .optional(),
    ticketHookEnabled: z.boolean().optional(),
})

type DiscordIntegrationFormValues = z.infer<typeof discordIntegrationSchema>

export function DiscordIntegrationForm() {
    const queryClient = useQueryClient()

    const { data: initialData, isLoading: isLoadingInitialData, isError, error } = useQuery({
        queryKey: ["discordIntegration"],
        queryFn: async () => {
            const token = getAuthToken();
            const headers: Record<string, string> = { Accept: 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;
            const response = await fetch(backendApi('admin/settings/discord'), { credentials: 'include', headers });
            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error("You are not authorized to view discord integration settings.")
                }
                throw new Error("Failed to load discord integration settings")
            }
            return response.json()
        },
    })

    const form = useForm<DiscordIntegrationFormValues>({
        resolver: zodResolver(discordIntegrationSchema),
        defaultValues: {
            guildIds: [""],
            clientId: "",
            clientSecret: "",
            botToken: "",
            webhookUrl: "",
            verificationHookColor: "#34ff00",
            verificationHookEnabled: true,
            ticketHookUrl: "",
            ticketHookColor: "#34ff00",
            ticketHookEnabled: true,
        },
    })

    const [clientSecretTouched, setClientSecretTouched] = React.useState(false)
    const [botTokenTouched, setBotTokenTouched] = React.useState(false)

    const guildIds = form.watch("guildIds")

    const addGuildId = () => {
        const currentIds = form.getValues("guildIds")
        form.setValue("guildIds", [...currentIds, ""])
    }

    const removeGuildId = (index: number) => {
        const currentIds = form.getValues("guildIds")
        if (currentIds.length > 1) {
            form.setValue("guildIds", currentIds.filter((_, i) => i !== index))
        }
    }

    useEffect(() => {
        if (initialData) {
            form.reset({
                guildIds: initialData.guildIds
                    ? initialData.guildIds
                    : initialData.guildId
                        ? [initialData.guildId]
                        : [""],
                clientId: initialData.clientId ?? "",
                clientSecret: "",
                botToken: "",
                webhookUrl: initialData.webhookUrl || "",
                verificationHookColor: initialData.verificationHookColor || "#34ff00",
                verificationHookEnabled: initialData.verificationHookEnabled ?? true,
                ticketHookUrl: initialData.ticketHookUrl || "",
                ticketHookColor: initialData.ticketHookColor || "#34ff00",
                ticketHookEnabled: initialData.ticketHookEnabled ?? true,
            })
            setClientSecretTouched(false)
            setBotTokenTouched(false)
        }
    }, [initialData, form])

    const mutation = useMutation({
        mutationFn: async (data: DiscordIntegrationFormValues) => {
            const payload: Record<string, unknown> = {
                guildIds: data.guildIds,
                webhookUrl: data.webhookUrl,
                verificationHookColor: data.verificationHookColor,
                verificationHookEnabled: data.verificationHookEnabled,
                ticketHookUrl: data.ticketHookUrl,
                ticketHookColor: data.ticketHookColor,
                ticketHookEnabled: data.ticketHookEnabled,
            }
            if (data.clientId !== undefined) payload.clientId = data.clientId || null
            if (clientSecretTouched) payload.clientSecret = data.clientSecret ?? ""
            if (botTokenTouched) payload.botToken = data.botToken ?? ""

            const token = getAuthToken();
            const headers: Record<string, string> = { 'Content-Type': 'application/json', Accept: 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;
            const response = await fetch(backendApi('admin/settings/discord'), {
                method: 'PUT',
                credentials: 'include',
                headers,
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error("You are not authorized to update discord integration settings.")
                }
                throw new Error("Failed to update discord integration settings")
            }

            return response.json()
        },
        onSuccess: () => {
            toast.success("Discord integration settings have been successfully updated.")
            queryClient.invalidateQueries({ queryKey: ["discordIntegration"] })
        },
        onError: (error) => {
            toast.error(error.message || "Failed to update site settings. Please try again.")
        },
    })

    function onSubmit(data: DiscordIntegrationFormValues) {
        mutation.mutate(data)
    }

    if (isLoadingInitialData) {
        return <DiscordIntegrationFormSkeleton />
    }

    if (isError) {
        return <DiscordIntegrationFormError error={error} />
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Discord Integration Settings</CardTitle>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                        <div className="space-y-4">
                            <FormLabel className="text-base">Application credentials</FormLabel>
                            <p className="text-sm text-muted-foreground">
                                Discord Application (Client) ID, Client Secret, and Bot Token. Used for OAuth and for the Discord Server / Role reload in Roles settings. Store the bot token here when hosting the bot on this site.
                            </p>
                            <FormField
                                control={form.control}
                                name="clientId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Client ID</FormLabel>
                                        <FormControl>
                                            <Input {...field} value={field.value ?? ""} placeholder="Discord Application ID" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="clientSecret"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Client Secret</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="password"
                                                autoComplete="off"
                                                {...field}
                                                value={field.value ?? ""}
                                                placeholder={initialData?.hasClientSecret ? "Leave blank to keep current" : "Discord Client Secret"}
                                                onChange={(e) => { setClientSecretTouched(true); field.onChange(e.target.value) }}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="botToken"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Bot Token</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="password"
                                                autoComplete="off"
                                                {...field}
                                                value={field.value ?? ""}
                                                placeholder={initialData?.hasBotToken ? "Leave blank to keep current" : "Discord Bot Token"}
                                                onChange={(e) => { setBotTokenTouched(true); field.onChange(e.target.value) }}
                                            />
                                        </FormControl>
                                        <FormDescription>Used for guild/role reload in Roles settings and future bot features.</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <div className="space-y-4">
                            <FormLabel>Discord Guild IDs</FormLabel>
                            {guildIds.map((_, idx) => (
                                <div key={idx} className="flex items-center gap-2">
                                    <FormField
                                        control={form.control}
                                        name={`guildIds.${idx}`}
                                        render={({ field }) => (
                                            <FormItem className="flex-1">
                                                <FormControl>
                                                    <Input {...field} />
                                                </FormControl>
                                                <FormDescription>
                                                    {idx === 0 ? "The ID of your Discord server." : ""}
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    {guildIds.length > 1 && (
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            size="icon"
                                            onClick={() => removeGuildId(idx)}
                                            title="Remove Guild ID"
                                        >
                                            &minus;
                                        </Button>
                                    )}
                                </div>
                            ))}
                            <Button
                                type="button"
                                variant="outline"
                                onClick={addGuildId}
                            >
                                + Add Guild ID
                            </Button>
                        </div>
                        <DiscordIntegrationFormAccordion form={form} />
                        <Button type="submit" disabled={mutation.isPending}>
                            {mutation.isPending ? "Updating..." : "Update Discord Settings"}
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    )
}

function DiscordIntegrationFormSkeleton() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Discord Integration Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
                {[...Array(4)].map((_, index) => (
                    <div key={index} className="space-y-2">
                        <Skeleton className="h-4 w-1/4" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                    </div>
                ))}
                <Skeleton className="h-10 w-1/4" />
            </CardContent>
        </Card>
    )
}

function DiscordIntegrationFormError({ error }: { error: Error }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Discord Integration Settings</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-destructive">{error.message}</p>
            </CardContent>
        </Card>
    )
}

const accordionItems: { title: string, url: string, color: string, enabled: string }[] = [
    {
        title: "Verification Hook",
        url: "webhookUrl",
        color: "verificationHookColor",
        enabled: "verificationHookEnabled",
    },
    {
        title: "Ticket Hook",
        url: "ticketHookUrl",
        color: "ticketHookColor",
        enabled: "ticketHookEnabled",
    }
]

function DiscordIntegrationFormAccordion({ form }: { form: UseFormReturn<DiscordIntegrationFormValues> }) {
    return (
        <Accordion type="single" collapsible>
            {accordionItems.map((item) => (
                <AccordionItem value={item.title} key={item.title}>
                    <AccordionTrigger>{item.title}</AccordionTrigger>
                    <AccordionContent className="space-y-8">
                        <FormField
                            control={form.control}
                            name={item.enabled as keyof DiscordIntegrationFormValues}
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border border-border/15 p-4">
                                    <div className="space-y-0.5">
                                        <FormLabel>
                                            Enable {item.title}
                                        </FormLabel>
                                        <FormDescription>
                                            Whether to send {item.title} embeds to Discord.
                                        </FormDescription>
                                    </div>
                                    <FormControl>
                                        <Switch checked={field.value as boolean} onCheckedChange={field.onChange} />
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name={item.url as keyof DiscordIntegrationFormValues}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{item.title} URL</FormLabel>
                                    <FormControl>
                                        <Input {...field} value={field.value?.toString() || ''} />
                                    </FormControl>
                                    <FormDescription>
                                        The Discord webhook URL for {item.title} (optional).
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name={item.color as keyof DiscordIntegrationFormValues}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{item.title} Color</FormLabel>
                                    <FormControl>
                                        <ColorPicker
                                            {...field}
                                            value={field.value?.toString() || "#34ff00"}
                                            onChange={(v) => {
                                                field.onChange(v)
                                            }}
                                        />

                                    </FormControl>
                                    <FormDescription>
                                        The color for {item.title} messages.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </AccordionContent>
                </AccordionItem>
            ))}
        </Accordion>
    )
}