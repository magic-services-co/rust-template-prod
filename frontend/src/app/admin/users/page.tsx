import { Metadata } from 'next'
import UsersListClient from './users-list-client'
import { Suspense } from 'react'

export const metadata: Metadata = {
    title: 'User Management',
    description: 'Manage user accounts.',
}

export default function UsersPage() {
    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold">User Management</h1>
            <Suspense fallback={<div className="animate-pulse space-y-4">
                <div className="h-12 bg-secondary/20 rounded-md" />
                <div className="h-[400px] bg-secondary/20 rounded-md" />
            </div>}>
                <UsersListClient />
            </Suspense>
        </div>
    )
}