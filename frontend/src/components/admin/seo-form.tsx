"use client"

import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type SeoFormData = {
    title: string
    description: string
    keywords: string
}

export function SeoForm() {
    const { register, handleSubmit } = useForm<SeoFormData>()

    const onSubmit = (data: SeoFormData) => {
        
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>SEO Settings</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <Input {...register('title')} placeholder="Page Title" />
                    <Textarea {...register('description')} placeholder="Meta Description" />
                    <Input {...register('keywords')} placeholder="Keywords (comma-separated)" />
                    <Button type="submit">Save SEO Settings</Button>
                </form>
            </CardContent>
        </Card>
    )
}