"use client"

import { useState, useEffect, useCallback, useMemo, type CSSProperties } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { Clock, Server, FolderOpen, Globe, AlertTriangle } from "lucide-react"
import { format } from "date-fns"
import { useProfileTheme } from "@/hooks/use-profile-theme"
import { withUserDefaults } from "@/lib/user-theme-defaults"

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
  serverTheme?: any
}

type BanTheme = ReturnType<typeof withUserDefaults>

function banAccentColor(type: string, theme: BanTheme): string {
  switch (type) {
    case "GLOBAL":
      return theme.buttonDestructiveBackground
    case "CATEGORY":
      return "hsl(25, 95%, 55%)"
    case "INDIVIDUAL":
      return "hsl(48, 96%, 55%)"
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

  const cardClass =
    "mt-4 backdrop-blur overflow-hidden hover:brightness-110 transition-all duration-300 shadow-none border-0 bg-transparent"
  const cardStyle: CSSProperties = {
    backgroundColor: theme.contentCardBackground,
    border: `1px solid ${theme.contentCardBorder}`,
    borderRadius: theme.cardBorderRadius,
    boxShadow: theme.cardShadow,
    color: theme.contentCardTitleColor,
  }

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
      <Card className={cardClass} style={cardStyle}>
        <CardHeader style={{ padding: theme.cardPadding }}>
          <CardTitle style={{ color: theme.contentCardTitleColor }}>Ban Status</CardTitle>
          <CardDescription style={{ color: theme.contentCardDescriptionColor }}>
            Loading ban information...
          </CardDescription>
        </CardHeader>
        <CardContent style={{ padding: theme.cardPadding, paddingTop: 0 }} className="space-y-3">
          <Skeleton className="h-4 w-full max-w-md opacity-40" />
          <Skeleton className="h-4 w-full max-w-sm opacity-40" />
        </CardContent>
      </Card>
    )
  }

  if (bans.length === 0) {
    return (
      <Card className={cardClass} style={cardStyle}>
        <CardHeader style={{ padding: theme.cardPadding }}>
          <CardTitle style={{ color: theme.contentCardTitleColor }}>Ban Status</CardTitle>
          <CardDescription style={{ color: theme.contentCardDescriptionColor }}>No active bans</CardDescription>
        </CardHeader>
        <CardContent style={{ padding: theme.cardPadding, paddingTop: 0 }}>
          <div
            className="text-center py-4 rounded-md"
            style={{
              backgroundColor: theme.roleBadgeBackground,
              border: `1px solid ${theme.contentCardBorder}`,
              borderRadius: theme.buttonBorderRadius,
            }}
          >
            <div className="text-sm font-medium" style={{ color: theme.buttonSuccessBackground }}>
              ✓ Account in good standing
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cardClass} style={cardStyle}>
      <CardHeader style={{ padding: theme.cardPadding }}>
        <CardTitle style={{ color: theme.contentCardTitleColor }}>Ban Status</CardTitle>
        <CardDescription style={{ color: theme.contentCardDescriptionColor }}>
          {bans.length} active ban{bans.length !== 1 ? "s" : ""}
        </CardDescription>
      </CardHeader>
      <CardContent style={{ padding: theme.cardPadding, paddingTop: 0 }} className="space-y-4">
        {bans.map((ban) => {
          const accent = banAccentColor(ban.banType, theme)
          return (
            <Alert
              key={ban.id}
              className="border-0 [&>svg]:text-current [&>svg]:left-4 [&>svg]:top-4"
              style={{
                backgroundColor: theme.roleBadgeBackground,
                border: `1px solid ${theme.contentCardBorder}`,
                borderLeft: `4px solid ${accent}`,
                borderRadius: theme.cardBorderRadius,
                color: theme.contentCardTitleColor,
              }}
            >
              <AlertTriangle className="h-4 w-4" style={{ color: accent }} />
              <AlertDescription>
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {getBanTypeIcon(ban.banType, accent)}
                    <span className="font-medium" style={{ color: theme.contentCardTitleColor }}>
                      {getBanTypeDescription(ban.banType)}
                    </span>
                    {ban.expiresAt && isExpired(ban.expiresAt) && (
                      <Badge
                        variant="destructive"
                        className="text-xs"
                        style={{
                          backgroundColor: theme.buttonDestructiveBackground,
                          color: theme.buttonDestructiveText,
                          borderRadius: theme.buttonBorderRadius,
                        }}
                      >
                        Expired
                      </Badge>
                    )}
                  </div>

                  <p className="text-sm" style={{ color: theme.contentCardDescriptionColor }}>
                    <span className="font-medium" style={{ color: theme.contentCardTitleColor }}>
                      Reason:
                    </span>{" "}
                    {ban.reason}
                  </p>

                  {ban.serverId && (
                    <p className="text-sm" style={{ color: theme.contentCardDescriptionColor }}>
                      <span className="font-medium" style={{ color: theme.contentCardTitleColor }}>
                        Server ID:
                      </span>{" "}
                      {ban.serverId}
                    </p>
                  )}

                  {ban.categoryId != null && (
                    <p className="text-sm" style={{ color: theme.contentCardDescriptionColor }}>
                      <span className="font-medium" style={{ color: theme.contentCardTitleColor }}>
                        Category ID:
                      </span>{" "}
                      {ban.categoryId}
                    </p>
                  )}

                  <div
                    className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs"
                    style={{ color: theme.contentCardDescriptionColor }}
                  >
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3 shrink-0" />
                      <span>Banned: {format(new Date(ban.createdAt), "MMM d, yyyy")}</span>
                    </div>
                    {ban.expiresAt && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3 shrink-0" />
                        <span>Expires: {format(new Date(ban.expiresAt), "MMM d, yyyy")}</span>
                      </div>
                    )}
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )
        })}
      </CardContent>
    </Card>
  )
}
