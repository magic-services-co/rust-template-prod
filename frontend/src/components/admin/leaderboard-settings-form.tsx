"use client"

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { backendApi } from '@/lib/api'
import { getAuthToken } from '@/lib/laravel-auth'
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { WipeManagement } from './wipe-management'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'

interface RetentionSettings {
    wipeRetentionEnabled: boolean
    wipeRetentionDays: number
    autoDeleteInactiveWipes: boolean
    keepMinimumWipes: number
    showWipeSelection: boolean
}

export function LeaderboardSettingsForm() {
    const queryClient = useQueryClient()
    
    const resetMutation = useMutation({
        mutationFn: async () => {
            const token = getAuthToken();
            const headers: Record<string, string> = { Accept: 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;
            const response = await fetch(backendApi('admin/leaderboard-settings/data'), {
                method: 'DELETE',
                credentials: 'include',
                headers,
            })
            if (!response.ok) {
                throw new Error(`Failed to reset leaderboard: ${response.statusText}`)
            }
            return response.json()
        },
        onSuccess: () => {
            toast.success("Leaderboard reset successfully")
        },
        onError: (error) => {
            const errorMessage = error instanceof Error ? error.message : 'Failed to reset leaderboard'
            toast.error(errorMessage)
        }
    })

    return (
        <div className="space-y-6">
            <WipeRetentionSettings />
            <WipeManagement />
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Leaderboard Settings</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="">
                        <h3 className="text-lg font-medium">Dangerous Zone</h3>
                        <p className="text-sm text-gray-500 mb-4">This action will permanently delete all user stats. This action cannot be undone and all data will be lost.</p>
                        <ResetLeaderboardDialog onReset={() => resetMutation.mutate()} />
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

function WipeRetentionSettings() {
    const queryClient = useQueryClient()
    const [settings, setSettings] = useState<RetentionSettings>({
        wipeRetentionEnabled: false,
        wipeRetentionDays: 90,
        autoDeleteInactiveWipes: false,
        keepMinimumWipes: 3,
        showWipeSelection: true,
    })
    const [hasChanges, setHasChanges] = useState(false)

    const { data, isLoading, error } = useQuery<RetentionSettings>({
        queryKey: ['leaderboard-retention-settings'],
        queryFn: async () => {
            const token = getAuthToken();
            const headers: Record<string, string> = { Accept: 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;
            const response = await fetch(backendApi('admin/leaderboard-settings/retention'), { credentials: 'include', headers });
            if (!response.ok) {
                throw new Error('Failed to fetch retention settings')
            }
            return response.json()
        },
    })

    useEffect(() => {
        if (data) {
            setSettings(data)
            setHasChanges(false)
        }
    }, [data])

    const updateMutation = useMutation({
        mutationFn: async (newSettings: RetentionSettings) => {
            const token = getAuthToken();
            const headers: Record<string, string> = { 'Content-Type': 'application/json', Accept: 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;
            const response = await fetch(backendApi('admin/leaderboard-settings/retention'), {
                method: 'POST',
                credentials: 'include',
                headers,
                body: JSON.stringify(newSettings),
            })
            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Failed to update retention settings')
            }
            return response.json()
        },
        onSuccess: () => {
            toast.success("Retention settings saved successfully")
            queryClient.invalidateQueries({ queryKey: ['leaderboard-retention-settings'] })
            setHasChanges(false)
        },
        onError: (error) => {
            const errorMessage = error instanceof Error ? error.message : 'Failed to save retention settings'
            toast.error(errorMessage)
        }
    })

    const handleChange = <K extends keyof RetentionSettings>(key: K, value: RetentionSettings[K]) => {
        setSettings(prev => ({ ...prev, [key]: value }))
        setHasChanges(true)
    }

    const handleSave = () => {
        updateMutation.mutate(settings)
    }

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Wipe Retention Settings</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                </CardContent>
            </Card>
        )
    }

    if (error) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Wipe Retention Settings</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-destructive">Error loading retention settings. Please try again.</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Wipe Retention Settings</CardTitle>
                <CardDescription>
                    Configure how long wipe data is retained and automatic cleanup options.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                        <Label htmlFor="retention-enabled">Enable Wipe Retention</Label>
                        <p className="text-sm text-muted-foreground">
                            Automatically remove old wipe data after a specified period
                        </p>
                    </div>
                    <Switch
                        id="retention-enabled"
                        checked={settings.wipeRetentionEnabled}
                        onCheckedChange={(checked) => handleChange('wipeRetentionEnabled', checked)}
                    />
                </div>

                {settings.wipeRetentionEnabled && (
                    <>
                        <div className="space-y-2">
                            <Label htmlFor="retention-days">Retention Period (Days)</Label>
                            <p className="text-sm text-muted-foreground">
                                Wipes older than this many days will be eligible for deletion (1-365 days)
                            </p>
                            <Input
                                id="retention-days"
                                type="number"
                                min={1}
                                max={365}
                                value={settings.wipeRetentionDays}
                                onChange={(e) => handleChange('wipeRetentionDays', parseInt(e.target.value) || 90)}
                                className="w-32"
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label htmlFor="auto-delete">Auto-Delete Inactive Wipes</Label>
                                <p className="text-sm text-muted-foreground">
                                    Automatically delete wipes that have ended and exceeded the retention period
                                </p>
                            </div>
                            <Switch
                                id="auto-delete"
                                checked={settings.autoDeleteInactiveWipes}
                                onCheckedChange={(checked) => handleChange('autoDeleteInactiveWipes', checked)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="keep-minimum">Keep Minimum Wipes</Label>
                            <p className="text-sm text-muted-foreground">
                                Always keep at least this many wipes per server, even if they exceed the retention period (0-100)
                            </p>
                            <Input
                                id="keep-minimum"
                                type="number"
                                min={0}
                                max={100}
                                value={settings.keepMinimumWipes}
                                onChange={(e) => handleChange('keepMinimumWipes', parseInt(e.target.value) || 3)}
                                className="w-32"
                            />
                        </div>
                    </>
                )}

                <div className="border-t pt-6">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label htmlFor="show-wipe-selection">Show Wipe Selection</Label>
                            <p className="text-sm text-muted-foreground">
                                Allow users to switch between individual wipes on the leaderboard. When disabled, only lifetime stats are shown.
                            </p>
                        </div>
                        <Switch
                            id="show-wipe-selection"
                            checked={settings.showWipeSelection}
                            onCheckedChange={(checked) => handleChange('showWipeSelection', checked)}
                        />
                    </div>
                </div>

                <div className="flex justify-end">
                    <Button 
                        onClick={handleSave} 
                        disabled={!hasChanges || updateMutation.isPending}
                    >
                        {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Changes
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}

function ResetLeaderboardDialog({ onReset }: { onReset: () => void }) {
    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="destructive">
                    Reset Leaderboard
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Reset Leaderboard Data</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action will permanently delete all user stats.
                        This action cannot be undone and all data will be lost.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={onReset}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                        Reset Leaderboard
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
