import { Metadata } from 'next'
import { columns } from './columns'
import { DataTable } from './data-table'
import { Suspense } from 'react'

export const metadata: Metadata = {
    title: 'Admin Logs',
    description: 'View all admin activity logs.',
}

export default function AdminLogsPage() {
    return (
        <>
            <Suspense fallback={<div>Loading...</div>}>
                <DataTable columns={columns} />
            </Suspense>
        </>
    )
}
