import { Puzzle } from "lucide-react"

import type { AdminNavMainItem } from "@/components/admin/navigation/nav-main"

export type RegisteredAddon = {
  id: string
  adminNav: AdminNavMainItem[]
}

export const addonRegistry: RegisteredAddon[] = [
  {
    id: "exampleaddon",
    adminNav: [
      {
        title: "Example Addon",
        url: "addons/example-addon",
        icon: Puzzle,
      },
    ],
  },
]
