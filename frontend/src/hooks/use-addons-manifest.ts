'use client'

import { useQuery } from '@tanstack/react-query'

import { backendApi } from '@/lib/api'

export type AddonManifestEntry = {
  id: string
  name: string
}

export type AddonsManifestResponse = {
  addons: AddonManifestEntry[]
}

async function fetchAddonsManifest(): Promise<AddonsManifestResponse> {
  const res = await fetch(backendApi('addons'), {
    headers: { Accept: 'application/json' },
    credentials: 'include',
  })
  if (!res.ok) {
    let detail = `HTTP ${res.status}`
    try {
      const body = await res.json()
      if (body?.error === 'license_required') {
        detail = 'License required — configure your site license on the backend.'
      } else if (typeof body?.message === 'string') {
        detail = body.message
      }
    } catch {
      // ignore
    }
    throw new Error(detail)
  }
  return (await res.json()) as AddonsManifestResponse
}

export const addonsManifestQueryKey = ['addonsManifest'] as const

export function useAddonsManifest() {
  return useQuery({
    queryKey: addonsManifestQueryKey,
    queryFn: fetchAddonsManifest,
    staleTime: 60 * 1000,
    retry: 1,
  })
}
