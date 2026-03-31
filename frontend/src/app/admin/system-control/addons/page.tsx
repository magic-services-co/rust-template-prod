import type { Metadata } from "next"
import Link from "next/link"

import { SystemControlAddonsPanel } from "@/components/admin/system-control-addons-panel"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "Addons",
  description: "Manage Laravel module addons.",
}

export default function SystemControlAddonsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Button variant="ghost" size="sm" className="text-muted-foreground -ml-2 mb-1 h-8 px-2" asChild>
            <Link href="/admin/system-control">← System Control</Link>
          </Button>
          <h1 className="text-3xl font-bold">Addons</h1>
        </div>
      </div>
      <SystemControlAddonsPanel />
    </div>
  )
}
