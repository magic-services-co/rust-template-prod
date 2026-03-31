"use client"

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type Server = {
    id: string
    name: string
    category: string
}

export function ServerForm() {
    const [servers, setServers] = useState<Server[]>([])
    const { register, handleSubmit, reset } = useForm<Omit<Server, 'id'>>()

    const onSubmit = (data: Omit<Server, 'id'>) => {
        setServers([...servers, { ...data, id: Date.now().toString() }])
        reset()
    }

    const removeServer = (id: string) => {
        setServers(servers.filter(server => server.id !== id))
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Server Settings</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <Input {...register('name')} placeholder="Server Name" />
                    <Input {...register('category')} placeholder="Category" />
                    <Button type="submit">Add Server</Button>
                </form>
                <ul className="mt-4 space-y-2">
                    {servers.map(server => (
                        <li key={server.id} className="flex justify-between items-center">
                            <span>{server.name} ({server.category})</span>
                            <Button onClick={() => removeServer(server.id)} variant="destructive">Remove</Button>
                        </li>
                    ))}
                </ul>
            </CardContent>
        </Card>
    )
}