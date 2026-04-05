"use client"

import { backendApi } from '@/lib/api'
import { getAuthToken } from '@/lib/laravel-auth'
import { useMemo, useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { CategoryWithId } from '@/types/tickets'
import { Checkbox } from '@/components/ui/checkbox'
import { format } from 'date-fns'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { CalendarIcon, Loader2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Textarea } from '@/components/ui/textarea'
import { ServerCombobox } from '@/components/server-combobox'
import ServerGrid from './server-grid'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import PlayerGrid from './player-grid'
import { useSupportTheme } from '@/hooks/use-support-theme'

interface DynamicTicketFormProps {
    categorySlug: string
    serverTheme?: any
}

export function DynamicTicketForm({ categorySlug, serverTheme }: DynamicTicketFormProps) {
    const { data: clientTheme } = useSupportTheme();
    
    const theme = clientTheme || serverTheme;
    
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(0)
    const [direction, setDirection] = useState(0)

    const { data: category, isLoading, isError, error } = useQuery<CategoryWithId>({
        queryKey: ['ticket-category', categorySlug],
        queryFn: async () => {
            const response = await fetch(backendApi(`support/${categorySlug}`), { credentials: 'include' })
            if (!response.ok) throw new Error('Failed to fetch category')
            return response.json()
        },
    })

    const formSchema = useMemo(() => {
        return z.object(
            (category?.steps ?? []).reduce((acc: any, step: any) => {
                step.fields.forEach((field: any) => {
                    let fieldSchema
                    switch (field.type) {
                        case 'string':
                            fieldSchema = z.string()
                            if (field.options?.minLength) fieldSchema = fieldSchema.min(field.options.minLength, `Minimum length is ${field.options.minLength}`)
                            if (field.options?.maxLength) fieldSchema = fieldSchema.max(field.options.maxLength, `Maximum length is ${field.options.maxLength}`)
                            break
                        case 'number':
                            fieldSchema = z.number()
                            if (field.options?.min) fieldSchema = fieldSchema.min(field.options.min, `Minimum value is ${field.options.min}`)
                            if (field.options?.max) fieldSchema = fieldSchema.max(field.options.max, `Maximum value is ${field.options.max}`)
                            break
                        case 'boolean':
                            fieldSchema = z.boolean()
                            break
                        case 'enum':
                            fieldSchema = z.enum(field.options?.enumOptions || [])
                            break
                        case 'date':
                            fieldSchema = z.date()
                            if (field.options?.minDate) fieldSchema = fieldSchema.min(new Date(field.options.minDate), `Minimum date is ${field.options.minDate}`)
                            if (field.options?.maxDate) fieldSchema = fieldSchema.max(new Date(field.options.maxDate), `Maximum date is ${field.options.maxDate}`)
                            break
                        case 'textarea':
                            fieldSchema = z.string()
                            if (field.options?.minLength) fieldSchema = fieldSchema.min(field.options.minLength, `Minimum length is ${field.options.minLength}`)
                            if (field.options?.maxLength) fieldSchema = fieldSchema.max(field.options.maxLength, `Maximum length is ${field.options.maxLength}`)
                            break
                        case 'players':
                            fieldSchema = z.array(z.string())
                            if (field.options?.min) fieldSchema = fieldSchema.min(field.options.min, `Minimum ${field.options.min} players required`)
                            if (field.options?.max) fieldSchema = fieldSchema.max(field.options.max, `Maximum ${field.options.max} players allowed`)
                            break
                        case 'server':
                            fieldSchema = z.string()
                            break
                        case 'server-grid':
                            fieldSchema = z.string()
                            break
                        case 'players-grid':
                            fieldSchema = z.array(z.string())
                            if (field.options?.min) fieldSchema = fieldSchema.min(field.options.min, `Minimum ${field.options.min} players required`)
                            if (field.options?.max) fieldSchema = fieldSchema.max(field.options.max, `Maximum ${field.options.max} players allowed`)
                            break
                        default:
                            fieldSchema = z.string()
                    }
                    acc[field.key] = field.required ? fieldSchema : fieldSchema.optional()
                })
                return acc
            }, {})
        )
    }, [category]);

    const submitTicket = useMutation({
        mutationFn: async (data: z.infer<typeof formSchema>) => {
            const token = getAuthToken()
            const headers: Record<string, string> = { 'Content-Type': 'application/json' }
            if (token) headers['Authorization'] = `Bearer ${token}`
            const response = await fetch(backendApi('support'), {
                method: 'POST',
                headers,
                credentials: 'include',
                body: JSON.stringify({ content: data, categoryId: categorySlug }),
            })
            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Failed to submit ticket')
            }
            return response.json()
        },
        onSuccess: (data) => {
            toast.success('Ticket submitted successfully')
            router.push(`/ticket/${data.id}`)
        },
        onError: (error) => {
            toast.error(error.message === 'Unauthorized' ? (
                'Please sign in to submit a ticket!'
            ) : (
                error.message || 'Failed to submit ticket'
            ))
        }
    })

    const defaultValues = useMemo(() =>
        category?.steps?.reduce((acc: any, step: any) => {
            step.fields.forEach((field: any) => {
                if (field.type === 'players-grid') {
                    acc[field.key] = []
                } else if (field.type === 'boolean') {
                    const def = field.options?.defaultValue
                    acc[field.key] = def === true || def === 'true'
                } else {
                    acc[field.key] = ''
                }
            })
            return acc
        }, {}) ?? {},
    [category])

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues,
        mode: 'onSubmit',
        criteriaMode: 'all'
    })

    useEffect(() => {
        if (!category?.steps?.length) return
        const values = (category?.steps ?? []).reduce((acc: any, step: any) => {
            step.fields.forEach((field: any) => {
                if (field.type === 'players-grid') acc[field.key] = []
                else if (field.type === 'boolean') {
                    const def = field.options?.defaultValue
                    acc[field.key] = def === true || def === 'true'
                }
                else acc[field.key] = ''
            })
            return acc
        }, {})
        form.reset(values)
    }, [category, form])

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[300px] py-8">
                <div className="flex items-center justify-center mb-4">
                    <span 
                        className="inline-flex items-center justify-center w-16 h-16 rounded-full"
                        style={{
                            backgroundColor: theme?.formBackground || "rgba(255, 255, 255, 0.1)"
                        }}
                    >
                        <Loader2 
                            className="w-12 h-12 animate-spin" 
                            style={{
                                color: theme?.loadingSpinnerColor || "#ffffff"
                            }}
                        />
                    </span>
                </div>
                <h2 
                    className="text-xl font-semibold mb-2"
                    style={{
                        color: theme?.titleColor || "#ffffff"
                    }}
                >
                    Loading Form
                </h2>
                <p 
                    style={{
                        color: theme?.subtitleColor || "#b0b0b0"
                    }}
                >
                    Please wait while we load the ticket form...
                </p>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="text-center py-8">
                <p style={{ color: theme?.errorTextColor || "#ef4444" }}>
                    Error loading form: {error.message}
                </p>
            </div>
        );
    }

    if (!category) {
        return (
            <div className="text-center py-8">
                <p style={{ color: theme?.helpTextColor || "#9ca3af" }}>
                    Category not found
                </p>
            </div>
        );
    }

    const currentStepFields = (category?.steps ?? []).find(step => step.order === currentStep)?.fields || []

    const variants = {
        enter: (direction: number) => ({
            x: direction > 0 ? 300 : -300,
            opacity: 0
        }),
        center: {
            x: 0,
            opacity: 1
        },
        exit: (direction: number) => ({
            x: direction < 0 ? 300 : -300,
            opacity: 0
        })
    }

    const handleNext = async (e: React.MouseEvent) => {
        e.preventDefault()
        const isValid = await form.trigger(currentStepFields.map((field: Record<string, unknown>) => field.key as string).filter(Boolean) as string[])
        if (isValid) {
            setDirection(1)
            setCurrentStep(prev => Math.min(prev + 1, (category?.steps ?? []).length - 1))
        }
    }

    const handlePrevious = () => {
        setDirection(-1)
        setCurrentStep(prev => prev - 1)
    }

    const onSubmit = (data: z.infer<typeof formSchema>) => {

        submitTicket.mutate(data)
    }

    return (
        <Card 
            className="mx-auto rounded-md"
            style={{
                backgroundColor: theme?.formBackground || "rgba(255, 255, 255, 0.05)",
                border: `1px solid ${theme?.formBorder || "rgba(255, 255, 255, 0.1)"}`,
                borderRadius: theme?.cardBorderRadius || "0.5rem"
            }}
        >
            <CardHeader>
                <CardTitle style={{ color: theme?.titleColor || "#ffffff" }}>
                    {category.name}
                </CardTitle>
                <CardDescription style={{ color: theme?.helpTextColor || "#9ca3af" }}>
                    Step {currentStep + 1} of {(category?.steps ?? []).length}
                </CardDescription>
            </CardHeader>
            <CardContent className='overflow-hidden'>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                        <AnimatePresence custom={direction} mode="wait">
                            <motion.div
                                key={currentStep}
                                custom={direction}
                                variants={variants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{ type: 'tween', duration: 0.3 }}
                                className="space-y-4"
                            >
                                {currentStepFields.map((field, index) => (
                                    <FormField
                                        key={String((field as Record<string, unknown>).id ?? (field as Record<string, unknown>).key ?? index)}
                                        control={form.control}
                                        name={(field as Record<string, unknown>).key as string}
                                        render={({ field: formField }) => (
                                            <FormItem>
                                                {field.type !== 'boolean' ? (
                                                    <FormLabel
                                                        className={cn({ "text-lg": field.type === 'server-grid' || field.type === 'players-grid' })}
                                                        style={{ color: theme?.labelColor || "#e5e7eb" }}
                                                    >
                                                        {(field as Record<string, unknown>).label as React.ReactNode}
                                                        {Boolean((field as Record<string, unknown>).required) && <span className="text-destructive ml-0.5">*</span>}
                                                    </FormLabel>
                                                ) : null}
                                                <FormControl>
                                                    <>
                                                        {field.type === 'string' && (
                                                            <Input
                                                                {...formField}
                                                                value={formField.value || ''}
                                                                placeholder={String(((field as Record<string, unknown>).options as Record<string, unknown> | undefined)?.placeholder ?? '')}
                                                                style={{
                                                                    backgroundColor: theme?.inputBackground || "rgba(255, 255, 255, 0.1)",
                                                                    border: `1px solid ${theme?.inputBorder || "rgba(255, 255, 255, 0.2)"}`,
                                                                    color: theme?.inputText || "#ffffff",
                                                                    borderRadius: theme?.buttonBorderRadius || "0.375rem"
                                                                }}
                                                            />
                                                        )}
                                                        {field.type === 'number' && (
                                                            <Input
                                                                {...formField}
                                                                type="number"
                                                                onChange={(e) => formField.onChange(Number(e.target.value))}
                                                                value={formField.value}
                                                                placeholder={String(((field as Record<string, unknown>).options as Record<string, unknown> | undefined)?.placeholder ?? '')}
                                                                style={{
                                                                    backgroundColor: theme?.inputBackground || "rgba(255, 255, 255, 0.1)",
                                                                    border: `1px solid ${theme?.inputBorder || "rgba(255, 255, 255, 0.2)"}`,
                                                                    color: theme?.inputText || "#ffffff",
                                                                    borderRadius: theme?.buttonBorderRadius || "0.375rem"
                                                                }}
                                                            />
                                                        )}
                                                        {field.type === 'boolean' ? (
                                                            <div className="w-full flex items-center gap-2">
                                                                <FormLabel style={{ color: theme?.labelColor || "#e5e7eb" }}>
                                                                    {(field as Record<string, unknown>).label as React.ReactNode}
                                                                     {Boolean((field as Record<string, unknown>).required) && <span className="text-destructive ml-0.5">*</span>}
                                                                </FormLabel>
                                                                <Checkbox
                                                                    checked={formField.value}
                                                                    onCheckedChange={formField.onChange}
                                                                />
                                                            </div>
                                                        ) : null}
                                                        {field.type === 'enum' ? (
                                                            <Select onValueChange={formField.onChange} defaultValue={formField.value}>
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder={`Select ${field.label}`} />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {((((field as Record<string, unknown>).options as Record<string, unknown> | undefined)?.enumOptions as string[] | undefined) ?? []).map((option: string) => (
                                                                        <SelectItem key={option} value={option}>
                                                                            {option}
                                                                        </SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        ) : null}
                                                        {field.type === 'date' ? (
                                                            <Popover>
                                                                <PopoverTrigger asChild>
                                                                    <Button
                                                                        variant={"outline"}
                                                                        className={cn(
                                                                            "w-[240px] pl-3 text-left font-normal ml-2",
                                                                            !formField.value && "text-muted-foreground"
                                                                        )}
                                                                    >
                                                                        {formField.value ? (
                                                                            format(formField.value, "PPP")
                                                                        ) : (
                                                                            <span>Pick a date</span>
                                                                        )}
                                                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                                    </Button>
                                                                </PopoverTrigger>
                                                                <PopoverContent className="w-auto p-0" align="start">
                                                                    <Calendar
                                                                        mode="single"
                                                                        selected={formField.value}
                                                                        onSelect={formField.onChange}
                                                                        disabled={(date) => {
                                                                            if (((field as Record<string, unknown>).options as Record<string, unknown> | undefined)?.minDate && date < new Date(((field as Record<string, unknown>).options as Record<string, unknown>).minDate as string)) {
                                                                                return true;
                                                                            }
                                                                            if (((field as Record<string, unknown>).options as Record<string, unknown> | undefined)?.maxDate && date > new Date(((field as Record<string, unknown>).options as Record<string, unknown>).maxDate as string)) {
                                                                                return true;
                                                                            }
                                                                            return false;
                                                                        }}
                                                                        initialFocus
                                                                    />
                                                                </PopoverContent>
                                                            </Popover>
                                                        ) : null}
                                                        {field.type === 'textarea' ? (
                                                            <Textarea
                                                                {...formField}
                                                                placeholder={String(((field as Record<string, unknown>).options as Record<string, unknown> | undefined)?.placeholder ?? '')}
                                                                style={{
                                                                    backgroundColor: theme?.inputBackground || "rgba(255, 255, 255, 0.1)",
                                                                    border: `1px solid ${theme?.inputBorder || "rgba(255, 255, 255, 0.2)"}`,
                                                                    color: theme?.inputText || "#ffffff",
                                                                    borderRadius: theme?.buttonBorderRadius || "0.375rem"
                                                                }}
                                                            />
                                                        ) : null}
                                                        {field.type === 'players' ? (
                                                            <ServerCombobox
                                                                value={formField.value}
                                                                onChange={formField.onChange}
                                                                groupByCategory={false}
                                                                allowGlobal={false}
                                                            />
                                                        ) : null}
                                                        {field.type === 'server' ? (
                                                            <ServerCombobox
                                                                value={formField.value}
                                                                onChange={formField.onChange}
                                                                align='start'
                                                            />
                                                        ) : null}
                                                        {field.type === 'server-grid' ? (
                                                            <>
                                                                <FormMessage />
                                                                <ServerGrid
                                                                    value={formField.value}
                                                                    onChange={formField.onChange}
                                                                />
                                                            </>
                                                        ) : null}
                                                        {field.type === 'players-grid' ? (
                                                            <>
                                                                <FormMessage />
                                                                <PlayerGrid
                                                                    value={formField.value}
                                                                    onChange={formField.onChange}
                                                                /*  min={field.options?.min} */
                                                                /*  max={field.options?.max} */
                                                                />
                                                            </>
                                                        ) : null}
                                                    </>
                                                </FormControl>
                                                {Boolean(((field as Record<string, unknown>).options as Record<string, unknown> | undefined)?.description) && (
                                                    <FormDescription>{((field as Record<string, unknown>).options as Record<string, unknown> | undefined)?.description as React.ReactNode}</FormDescription>
                                                )}
                                                {field.type === 'server-grid' || field.type === 'players-grid' ? null : <FormMessage />}
                                            </FormItem>
                                        )}
                                    />
                                ))}
                            </motion.div>
                        </AnimatePresence>
                        <div className="flex justify-between">
                            {currentStep > 0 && (
                                <Button 
                                    type="button" 
                                    onClick={handlePrevious}
                                    style={{
                                        backgroundColor: theme?.buttonSecondaryBackground || "transparent",
                                        color: theme?.buttonSecondaryText || "#9ca3af",
                                        border: `1px solid ${theme?.buttonSecondaryBorder || "#374151"}`,
                                        borderRadius: theme?.buttonBorderRadius || "0.375rem"
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor = theme?.buttonSecondaryHoverBackground || "#374151";
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = theme?.buttonSecondaryBackground || "transparent";
                                    }}
                                >
                                    Previous
                                </Button>
                            )}
                            {currentStep < ((category?.steps ?? []).length - 1) ? (
                                <Button 
                                    type="button" 
                                    onClick={handleNext}
                                    style={{
                                        backgroundColor: theme?.buttonPrimaryBackground || "#52525b",
                                        color: theme?.buttonPrimaryText || "#ffffff",
                                        borderRadius: theme?.buttonBorderRadius || "0.375rem"
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor = theme?.buttonPrimaryHoverBackground || "#71717a";
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = theme?.buttonPrimaryBackground || "#52525b";
                                    }}
                                >
                                    Next
                                </Button>
                            ) : (
                                <Button 
                                    type="submit" 
                                    disabled={submitTicket.isPending || submitTicket.isSuccess}
                                    style={{
                                        backgroundColor: theme?.buttonPrimaryBackground || "#52525b",
                                        color: theme?.buttonPrimaryText || "#ffffff",
                                        borderRadius: theme?.buttonBorderRadius || "0.375rem"
                                    }}
                                    onMouseEnter={(e) => {
                                        if (!e.currentTarget.disabled) {
                                            e.currentTarget.style.backgroundColor = theme?.buttonPrimaryHoverBackground || "#71717a";
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (!e.currentTarget.disabled) {
                                            e.currentTarget.style.backgroundColor = theme?.buttonPrimaryBackground || "#52525b";
                                        }
                                    }}
                                >
                                    {submitTicket.isPending ? (
                                        <Loader2 
                                            className="h-4 w-4 animate-spin" 
                                            style={{ color: theme?.buttonPrimaryText || "#ffffff" }}
                                        />
                                    ) : 'Submit Ticket'}
                                </Button>
                            )}
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    )
}

