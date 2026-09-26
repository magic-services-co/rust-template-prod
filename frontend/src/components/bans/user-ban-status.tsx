"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Clock, Server, FolderOpen, Globe, AlertTriangle, Check } from "lucide-react"
import { format } from "date-fns"
import { useProfileTheme } from "@/hooks/use-profile-theme"
import { withUserDefaults } from "@/lib/user-theme-defaults"
import { ProfileEmpty, ProfilePanel } from "@/components/profile/profile-ui"
import { cn } from "@/lib/utils"

interface UserBan {
  id: string
  reason: string
  banType: "GLOBAL" | "CATEGORY" | "INDIVIDUAL"
  serverId?: string
  categoryId?: number
  expiresAt?: string
  createdAt: string
}

interface UserBanStatusProps {
  userId: string
  serverTheme?: Record<string, unknown>
}

type BanTheme = ReturnType<typeof withUserDefaults>

function banAccentColor(type: string, theme: BanTheme): string {
  switch (type) {
    case "GLOBAL":
      return "#e8a0a3"
    case "CATEGORY":
      return "#f0c970"
    case "INDIVIDUAL":
      return "#d7b15a"
    default:
      return theme.linkColor
  }
}

export function UserBanStatus({ userId, serverTheme }: UserBanStatusProps) {
  const { data: clientTheme } = useProfileTheme()
  const theme = useMemo(
    () => withUserDefaults(clientTheme || serverTheme),
    [clientTheme, serverTheme],
  )

  const [bans, setBans] = useState<UserBan[]>([])
  const [loading, setLoading] = useState(true)

  const fetchUserBans = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/bans/user/${userId}?includeInactive=false`)
      if (response.ok) {
        const data = await response.json()
        setBans(data || [])
      }
    } catch (error) {
      console.error("Error fetching user bans:", error)
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    fetchUserBans()
  }, [fetchUserBans])

  const getBanTypeIcon = (type: string, accent: string) => {
    const iconClass = "h-4 w-4 shrink-0"
    switch (type) {
      case "GLOBAL":
        return <Globe className={iconClass} style={{ color: accent }} />
      case "CATEGORY":
        return <FolderOpen className={iconClass} style={{ color: accent }} />
      case "INDIVIDUAL":
        return <Server className={iconClass} style={{ color: accent }} />
      default:
        return <AlertTriangle className={iconClass} style={{ color: accent }} />
    }
  }

  const getBanTypeDescription = (type: string) => {
    switch (type) {
      case "GLOBAL":
        return "Banned from all servers"
      case "CATEGORY":
        return "Banned from server category"
      case "INDIVIDUAL":
        return "Banned from specific server"
      default:
        return "Banned"
    }
  }

  const isExpired = (expiresAt?: string) => {
    if (!expiresAt) return false
    return new Date(expiresAt) < new Date()
  }

  if (loading) {
    return (
      <div
        className="h-[140px] animate-pulse border"
        style={{ borderColor: "rgba(255,255,255,0.1)", backgroundColor: "rgba(8,12,17,0.6)" }}
      />
    )
  }

  if (bans.length === 0) {
    return (
      <ProfileEmpty
        kicker="STANDING"
        title="ACCOUNT IN GOOD STANDING"
        body="There are no active bans on this account."
        action={
          <span className="ticket-chip ticket-chip-yes">
            <Check className="mr-1.5 h-3.5 w-3.5" />
            CLEAR
          </span>
        }
      />
    )
  }

  return (
    <div className="space-y-3">
      <p className="support-form-help text-[12px]">
        {bans.length} active ban{bans.length === 1 ? "" : "s"}
      </p>
      {bans.map((ban) => {
        const accent = banAccentColor(ban.banType, theme)
        const expired = ban.expiresAt ? isExpired(ban.expiresAt) : false
        return (
          <ProfilePanel key={ban.id}>
            <div className="relative p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="support-form-kicker text-[9px] font-bold tracking-[1.62px]">{ban.banType}</p>
                  <h3 className="support-form-title flex items-center gap-2 pt-1 text-[18px] font-extrabold leading-6">
                    {getBanTypeIcon(ban.banType, accent)}
                    {getBanTypeDescription(ban.banType).toUpperCase()}
                  </h3>
                </div>
                <span className={cn("ticket-chip", expired ? "" : "ticket-chip-no")}>
                  {expired ? "EXPIRED" : "ACTIVE"}
                </span>
              </div>

              <p className="support-form-help pt-3 text-[13px] leading-5">
                {ban.reason}
              </p>

              <div className="flex flex-wrap gap-x-5 gap-y-2 pt-4">
                {ban.serverId ? (
                  <div>
                    <p className="support-form-label">Server</p>
                    <p className="pt-1 font-mono text-[12px]" style={{ color: "#eef4fb" }}>{ban.serverId}</p>
                  </div>
                ) : null}
                {ban.categoryId != null ? (
                  <div>
                    <p className="support-form-label">Category</p>
                    <p className="pt-1 font-mono text-[12px]" style={{ color: "#eef4fb" }}>{ban.categoryId}</p>
                  </div>
                ) : null}
                <div>
                  <p className="support-form-label">Issued</p>
                  <p className="flex items-center gap-1.5 pt-1 text-[12px]" style={{ color: "#eef4fb" }}>
                    <Clock className="h-3 w-3" />
                    {format(new Date(ban.createdAt), "MMM d, yyyy")}
                  </p>
                </div>
                {ban.expiresAt ? (
                  <div>
                    <p className="support-form-label">Expires</p>
                    <p className="flex items-center gap-1.5 pt-1 text-[12px]" style={{ color: "#eef4fb" }}>
                      <Clock className="h-3 w-3" />
                      {format(new Date(ban.expiresAt), "MMM d, yyyy")}
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="support-form-label">Expires</p>
                    <p className="pt-1 text-[12px]" style={{ color: "#eef4fb" }}>Permanent</p>
                  </div>
                )}
              </div>
            </div>
          </ProfilePanel>
        )
      })}
    </div>
  )
}
