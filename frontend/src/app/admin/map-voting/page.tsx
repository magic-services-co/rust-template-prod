import { AddMapVoteForm } from "@/components/admin/map-voting/add-map-vote-form";
import { MapList } from "@/components/admin/map-voting/map-list";
import { RustMapsSettingsDialog } from "@/components/admin/map-voting/rustmaps-settings-dialog";
import { MapVotingClientShell } from "@/app/admin/map-voting/map-voting-client-shell";
import { Metadata } from 'next'
import { Suspense } from 'react'

export const metadata: Metadata = {
    title: 'Map Voting',
    description: 'Manage map voting.',
}

export default function MapVotingPage() {
    return (
        <MapVotingClientShell>
            <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h1 className="text-2xl font-bold">Map Voting Management</h1>
                    <RustMapsSettingsDialog />
                </div>
                <Suspense fallback={<div>Loading map voting form...</div>}>
                    <AddMapVoteForm />
                </Suspense>
                <Suspense fallback={<div>Loading map list...</div>}>
                    <MapList />
                </Suspense>
            </div>
        </MapVotingClientShell>
    )
}
