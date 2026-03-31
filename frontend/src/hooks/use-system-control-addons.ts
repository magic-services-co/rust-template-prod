'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { addonsManifestQueryKey } from '@/hooks/use-addons-manifest'
import { backendApi } from '@/lib/api'

export type SystemControlAddon = {
  alias: string
  name: string
  description: string
  enabled: boolean
  thumbnail: string | null
  admin_configure_path: string | null
}

export type SystemControlAddonsResponse = {
  addons: SystemControlAddon[]
}

async function fetchSystemControlAddons(): Promise<SystemControlAddonsResponse> {
  const res = await fetch(backendApi('admin/system-control/addons'), {
    headers: { Accept: 'application/json' },
    credentials: 'include',
  })
  if (!res.ok) {
    throw new Error('Failed to load addons')
  }
  return res.json()
}

async function patchAddonEnabled(
  alias: string,
  enabled: boolean
): Promise<{ addon: SystemControlAddon }> {
  const res = await fetch(backendApi(`admin/system-control/addons/${encodeURIComponent(alias)}`), {
    method: 'PATCH',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ enabled }),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(
      typeof body?.message === 'string' ? body.message : 'Could not update addon'
    )
  }
  return res.json()
}

export const systemControlAddonsQueryKey = ['admin', 'systemControl', 'addons'] as const

export function useSystemControlAddons() {
  return useQuery({
    queryKey: systemControlAddonsQueryKey,
    queryFn: fetchSystemControlAddons,
    staleTime: 30 * 1000,
  })
}

export function useSetAddonEnabledMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ alias, enabled }: { alias: string; enabled: boolean }) =>
      patchAddonEnabled(alias, enabled),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: systemControlAddonsQueryKey })
      queryClient.invalidateQueries({ queryKey: addonsManifestQueryKey })
    },
  })
}
