'use client'

import { useMemo } from 'react'

import { addonRegistry } from '@/addons/registry'
import type { AdminNavMainItem } from '@/components/admin/navigation/nav-main'

import { useAddonsManifest } from './use-addons-manifest'

export function useAddonAdminNavItems(): AdminNavMainItem[] {
  const { data } = useAddonsManifest()

  return useMemo(() => {
    if (!data?.addons) return []
    const enabled = new Set(data.addons.map((a) => a.id))
    return addonRegistry
      .filter((addon) => enabled.has(addon.id))
      .flatMap((addon) => addon.adminNav)
  }, [data?.addons])
}
