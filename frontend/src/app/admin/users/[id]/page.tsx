import { notFound } from 'next/navigation'
import Link from 'next/link'
import UserHeader from '@/components/admin/users/user-header'
import { getUser } from '@/app/actions/admin-user'
import UserProfileTabs from '@/components/admin/users/user-profile-tabs'
import { Metadata } from 'next'
import { Button } from '@/components/ui/button'
import { ChevronLeft } from 'lucide-react'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
    const { id } = await params;
    const result = await getUser(id)
    if (result.error || !result.data) {
        return {
            title: "User Not Found"
        }
    }

    return {
        title: result.data.name,
    }
}

export default async function UserPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const result = await getUser(id)
    if (result.error || !result.data) {
        if (result.status === 404) {
            notFound()
        }
        throw new Error(result.error || "User not found")
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" asChild>
                    <Link href="/admin/users">
                        <ChevronLeft className="mr-1 h-4 w-4" />
                        Users
                    </Link>
                </Button>
                <span className="text-muted-foreground">/</span>
                <span className="font-medium truncate">{result.data.name || 'User'}</span>
            </div>
            <UserHeader user={result.data} />
            <UserProfileTabs user={result.data} />
        </div>
    )
}