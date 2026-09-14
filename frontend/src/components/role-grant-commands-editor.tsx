'use client'

import { Button } from '@/components/ui/button'
import { GameServerCommandField } from '@/components/game-server-command-field'
import {
    defaultRoleGrantCommandValue,
    type RoleGrantCommandValue,
} from '@/lib/game-server-command'
import { Plus, Trash2 } from 'lucide-react'

export type RoleGrantCommandsEditorProps = {
    serverId?: string | null
    commands: RoleGrantCommandValue[]
    onChange: (commands: RoleGrantCommandValue[]) => void
    hasPterodactyl?: boolean
    bmEnabled?: boolean
    disabled?: boolean
}

export function RoleGrantCommandsEditor({
    serverId,
    commands,
    onChange,
    hasPterodactyl = false,
    bmEnabled = true,
    disabled = false,
}: RoleGrantCommandsEditorProps) {
    const serverSelected = Boolean(serverId && serverId.trim() !== '')
    const rows = commands.length > 0 ? commands : []

    const updateRow = (index: number, value: RoleGrantCommandValue) => {
        const next = [...rows]
        next[index] = value
        onChange(next)
    }

    const removeRow = (index: number) => {
        onChange(rows.filter((_, i) => i !== index))
    }

    const addRow = () => {
        onChange([...rows, { ...defaultRoleGrantCommandValue }])
    }

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
                <div>
                    <p className="text-sm font-medium">Role commands</p>
                    <p className="text-xs text-muted-foreground">
                        Add runs when the role is granted; Revoke runs when the role is removed.
                    </p>
                </div>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={disabled || !serverSelected}
                    onClick={addRow}
                >
                    <Plus className="h-4 w-4 mr-1" />
                    Command
                </Button>
            </div>

            {rows.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">
                    {serverSelected
                        ? 'No commands yet. Click + Command to add one.'
                        : 'Select a server first.'}
                </p>
            ) : (
                <div className="space-y-2">
                    {rows.map((row, cmdIdx) => (
                        <div key={cmdIdx} className="flex gap-2 items-start">
                            <div className="flex-1 min-w-0">
                                <GameServerCommandField
                                    serverId={serverId}
                                    value={row}
                                    onChange={(v) => updateRow(cmdIdx, v as RoleGrantCommandValue)}
                                    hasPterodactyl={hasPterodactyl}
                                    bmEnabled={bmEnabled}
                                    disabled={disabled || !serverSelected}
                                    showActionSelector
                                    label=""
                                    description=""
                                />
                            </div>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="shrink-0 text-destructive hover:text-destructive"
                                disabled={disabled}
                                onClick={() => removeRow(cmdIdx)}
                                title="Remove command"
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
