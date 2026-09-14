import { backendApi } from '@/lib/api'
import { getAuthToken } from '@/lib/laravel-auth'

export type GameServerCommandChannel = 'ptero' | 'bm'

export type GameServerCommandAction = 'add' | 'revoke'

export type GameServerCommandValue = {
    command: string
    channel: GameServerCommandChannel
}

/** Role automation row (channel + add/revoke + command). */
export type RoleGrantCommandValue = GameServerCommandValue & {
    action: GameServerCommandAction
}

/** Stored on Role.grantCommands when persisting role grant automation. */
export type RoleGrantCommandEntry = RoleGrantCommandValue & {
    serverId: string
}

export const defaultGameServerCommandValue: GameServerCommandValue = {
    command: '',
    channel: 'bm',
}

export const defaultRoleGrantCommandValue: RoleGrantCommandValue = {
    command: '',
    channel: 'bm',
    action: 'add',
}

export function gameServerCommandApiPath(
    serverId: string,
    channel: GameServerCommandChannel
): string {
    const encoded = encodeURIComponent(serverId)
    return channel === 'bm'
        ? `admin/servers/${encoded}/battlemetrics/command`
        : `admin/servers/${encoded}/pterodactyl/command`
}

export function authHeaders(json = false): Record<string, string> {
    const token = getAuthToken()
    const h: Record<string, string> = { Accept: 'application/json' }
    if (token) h['Authorization'] = `Bearer ${token}`
    if (json) h['Content-Type'] = 'application/json'
    return h
}

export async function sendGameServerCommand(
    serverId: string,
    command: string,
    channel: GameServerCommandChannel
): Promise<void> {
    const trimmed = command.trim()
    if (!trimmed) {
        throw new Error('Command cannot be empty.')
    }

    const res = await fetch(backendApi(gameServerCommandApiPath(serverId, channel)), {
        method: 'POST',
        credentials: 'include',
        headers: authHeaders(true),
        body: JSON.stringify({ command: trimmed }),
    })

    if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error((json as { error?: string }).error || `Command failed (${res.status})`)
    }
}
