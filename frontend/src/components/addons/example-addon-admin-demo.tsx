'use client'

import { useQuery } from '@tanstack/react-query'

import { useAddonsManifest } from '@/hooks/use-addons-manifest'
import { backendApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

async function fetchExamplePing(): Promise<{ addon: string; message: string }> {
  const res = await fetch(backendApi('addons/example-addon/ping'), {
    headers: { Accept: 'application/json' },
    credentials: 'include',
  })
  if (!res.ok) {
    throw new Error(`Ping failed (${res.status})`)
  }
  return res.json()
}

export function ExampleAddonAdminDemo() {
  const manifest = useAddonsManifest()
  const pingQuery = useQuery({
    queryKey: ['exampleAddonPing'],
    queryFn: fetchExamplePing,
    retry: false,
  })

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Example Addon</h2>
        <p className="text-muted-foreground text-sm">
          Demo page wired to Laravel <code className="text-xs">Modules/ExampleAddon</code> and the
          shared <code className="text-xs">GET /api/addons</code> manifest.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Manifest</CardTitle>
          <CardDescription>
            From <code className="text-xs">GET /api/addons</code> (enabled nWidart modules).
          </CardDescription>
        </CardHeader>
        <CardContent>
          {manifest.isLoading ? (
            <p className="text-muted-foreground text-sm">Loading…</p>
          ) : manifest.isError ? (
            <p className="text-destructive text-sm">
              {(manifest.error as Error)?.message ?? 'Could not load manifest.'}
            </p>
          ) : (
            <pre className="bg-muted max-h-64 overflow-auto rounded-md p-3 text-xs">
              {JSON.stringify(manifest.data, null, 2)}
            </pre>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Module ping</CardTitle>
          <CardDescription>
            From <code className="text-xs">GET /api/addons/example-addon/ping</code>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {pingQuery.isError && (
            <p className="text-destructive text-sm">
              {(pingQuery.error as Error)?.message ?? 'Request failed'}
            </p>
          )}
          {pingQuery.data && (
            <pre className="bg-muted overflow-auto rounded-md p-3 text-xs">
              {JSON.stringify(pingQuery.data, null, 2)}
            </pre>
          )}
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => pingQuery.refetch()}
            disabled={pingQuery.isFetching}
          >
            {pingQuery.isFetching ? 'Retrying…' : 'Retry ping'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
