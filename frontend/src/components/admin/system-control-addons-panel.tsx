"use client"

import Link from "next/link"
import { Loader2, Puzzle, Settings2 } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import {
  useSetAddonEnabledMutation,
  useSystemControlAddons,
} from "@/hooks/use-system-control-addons"

function AddonCard({
  addon,
  busy,
  onToggle,
}: {
  addon: {
    alias: string
    name: string
    description: string
    enabled: boolean
    thumbnail: string | null
    admin_configure_path: string | null
  }
  busy: boolean
  onToggle: (enabled: boolean) => void
}) {
  const configureHref =
    addon.admin_configure_path != null && addon.admin_configure_path !== ""
      ? `/admin/${addon.admin_configure_path.replace(/^\//, "")}`
      : null

  return (
    <Card className="flex flex-col overflow-hidden pt-0">
      <div className="bg-muted relative aspect-[16/9] w-full overflow-hidden">
        {addon.thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element -- addon URLs come from module.json (any host)
          <img
            src={addon.thumbnail}
            alt=""
            className="size-full object-cover"
          />
        ) : (
          <div className="text-muted-foreground flex size-full items-center justify-center">
            <Puzzle className="size-14 opacity-40" aria-hidden />
          </div>
        )}
        <div className="absolute right-2 top-2">
          <Badge variant={addon.enabled ? "default" : "secondary"}>
            {addon.enabled ? "Active" : "Inactive"}
          </Badge>
        </div>
      </div>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg leading-tight">{addon.name}</CardTitle>
        <CardDescription className="font-mono text-xs">{addon.alias}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4 pb-2">
        <p className="text-muted-foreground text-sm">
          {addon.description?.trim() ? addon.description : "No description in module.json."}
        </p>
        <div className="flex items-center justify-between gap-3 rounded-md border p-3">
          <div className="space-y-0.5">
            <p className="text-sm font-medium">Enabled</p>
            <p className="text-muted-foreground text-xs">
              Turn off to unregister routes and hide UI hooks on next load.
            </p>
          </div>
          <Switch
            checked={addon.enabled}
            disabled={busy}
            onCheckedChange={(v) => onToggle(v)}
            aria-label={`Enable ${addon.name}`}
          />
        </div>
      </CardContent>
      <CardFooter className="flex flex-wrap gap-2 border-t pt-4">
        {configureHref && addon.enabled ? (
          <Button variant="secondary" size="sm" asChild>
            <Link href={configureHref}>
              <Settings2 className="mr-1.5 size-4" />
              Configure
            </Link>
          </Button>
        ) : configureHref ? (
          <Button variant="secondary" size="sm" disabled title="Enable the addon to open its admin UI">
            <Settings2 className="mr-1.5 size-4" />
            Configure
          </Button>
        ) : (
          <Button variant="ghost" size="sm" disabled className="text-muted-foreground">
            No configure URL
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}

export function SystemControlAddonsPanel() {
  const { data, isLoading, isError, error, refetch } = useSystemControlAddons()
  const mutation = useSetAddonEnabledMutation()

  const handleToggle = (alias: string, enabled: boolean) => {
    const prev = data?.addons.find((a) => a.alias === alias)?.enabled
    mutation.mutate(
      { alias, enabled },
      {
        onSuccess: () => {
          toast.success(enabled ? "Addon activated" : "Addon deactivated")
        },
        onError: (e) => {
          toast.error(e instanceof Error ? e.message : "Update failed")
          if (prev !== undefined) {
            void refetch()
          }
        },
      }
    )
  }

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Installed modules</h2>
      </div>

      {isLoading && (
        <div className="text-muted-foreground flex items-center gap-2 text-sm">
          <Loader2 className="size-4 animate-spin" />
          Loading addons…
        </div>
      )}

      {isError && (
        <p className="text-destructive text-sm">
          {error instanceof Error ? error.message : "Could not load addons."}
        </p>
      )}

      {data && data.addons.length === 0 && (
        <p className="text-muted-foreground text-sm">No modules in /Modules.</p>
      )}

      {data && data.addons.length > 0 && (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {data.addons.map((addon) => (
            <AddonCard
              key={addon.alias}
              addon={addon}
              busy={
                mutation.isPending && mutation.variables?.alias === addon.alias
              }
              onToggle={(enabled) => handleToggle(addon.alias, enabled)}
            />
          ))}
        </div>
      )}
    </section>
  )
}
