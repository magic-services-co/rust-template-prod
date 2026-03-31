"use client"

import { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Filter, Clock, User, Server, FolderOpen, Globe, Ban } from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"
import { useBansTheme } from "../bans-theme-provider"

interface Ban {
    id: string
    userId: string
    reason: string
    banType: 'GLOBAL' | 'CATEGORY' | 'INDIVIDUAL'
    serverId?: string
    categoryId?: number
    expiresAt?: string
    isActive: boolean
    createdAt: string
    updatedAt: string
    user?: {
        id: string
        name: string
        email: string
        image?: string
        player?: {
            steam_id: string
            username: string
            avatar?: string
        }
    }
    admin: {
        id: string
        name: string
        email: string
    }
}

export function BansList() {
    const theme = useBansTheme()
    const [bans, setBans] = useState<Ban[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [banTypeFilter, setBanTypeFilter] = useState('all')
    const [statusFilter, setStatusFilter] = useState('all')
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [totalBans, setTotalBans] = useState(0)

    const fetchBans = useCallback(async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: '20',
                ...(searchTerm && { search: searchTerm }),
                ...(banTypeFilter !== 'all' && { banType: banTypeFilter }),
                ...(statusFilter !== 'all' && { isActive: statusFilter === 'active' ? 'true' : 'false' })
            })

            const response = await fetch(`/api/bans?${params}`)
            if (response.ok) {
                const data = await response.json()
                setBans(data.bans || [])
                setTotalPages(Math.ceil(data.total / 20))
                setTotalBans(data.total)
            } else {
                toast.error('Failed to fetch bans')
            }
        } catch (error) {
            console.error('Error fetching bans:', error)
            toast.error('Failed to fetch bans')
        } finally {
            setLoading(false)
        }
    }, [page, searchTerm, banTypeFilter, statusFilter])

    useEffect(() => {
        fetchBans()
    }, [fetchBans])

    const getBanTypeIcon = (type: string) => {
        switch (type) {
            case 'GLOBAL':
                return <Globe className="h-4 w-4" />
            case 'CATEGORY':
                return <FolderOpen className="h-4 w-4" />
            case 'INDIVIDUAL':
                return <Server className="h-4 w-4" />
            default:
                return <Ban className="h-4 w-4" />
        }
    }

    const getBanTypeColor = (type: string) => {
        switch (type) {
            case 'GLOBAL':
                return {
                    background: theme?.badgeGlobalBackground || 'bg-red-100 dark:bg-red-900',
                    text: theme?.badgeGlobalText || 'text-red-800 dark:text-red-200'
                }
            case 'CATEGORY':
                return {
                    background: theme?.badgeCategoryBackground || 'bg-orange-100 dark:bg-orange-900',
                    text: theme?.badgeCategoryText || 'text-orange-800 dark:text-orange-200'
                }
            case 'INDIVIDUAL':
                return {
                    background: theme?.badgeIndividualBackground || 'bg-yellow-100 dark:bg-yellow-900',
                    text: theme?.badgeIndividualText || 'text-yellow-800 dark:text-yellow-200'
                }
            default:
                return {
                    background: 'bg-gray-100 dark:bg-gray-900',
                    text: 'text-gray-800 dark:text-gray-200'
                }
        }
    }

    const getStatusColor = (isActive: boolean) => {
        return isActive 
            ? {
                background: theme?.badgeActiveBackground || 'bg-red-100 dark:bg-red-900',
                text: theme?.badgeActiveText || 'text-red-800 dark:text-red-200'
            }
            : {
                background: theme?.badgeInactiveBackground || 'bg-gray-100 dark:bg-gray-900',
                text: theme?.badgeInactiveText || 'text-gray-800 dark:text-gray-200'
            }
    }

    const formatDate = (dateString: string) => {
        return format(new Date(dateString), 'MMM dd, yyyy HH:mm')
    }

    const formatExpiry = (expiresAt: string | null) => {
        if (!expiresAt) return 'Permanent'
        const expiry = new Date(expiresAt)
        const now = new Date()
        if (expiry <= now) return 'Expired'
        return format(expiry, 'MMM dd, yyyy HH:mm')
    }

    return (
        <div className="space-y-6">
            <Card 
                style={{
                    backgroundColor: theme?.searchBackground || undefined,
                    border: theme?.searchBorder ? `1px solid ${theme.searchBorder}` : undefined,
                    borderRadius: theme?.searchBorderRadius || undefined
                }}
            >
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <Filter className="h-5 w-5" />
                        <span>Search & Filters</span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                            <Input
                                placeholder="Search by name, email, or Steam ID..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                                style={{
                                    backgroundColor: theme?.inputBackground || undefined,
                                    border: theme?.inputBorder ? `1px solid ${theme.inputBorder}` : undefined,
                                    color: theme?.inputTextColor || undefined,
                                    borderRadius: theme?.inputBorderRadius || undefined
                                }}
                            />
                        </div>
                        <Select value={banTypeFilter} onValueChange={setBanTypeFilter}>
                            <SelectTrigger
                                style={{
                                    backgroundColor: theme?.inputBackground || undefined,
                                    border: theme?.inputBorder ? `1px solid ${theme.inputBorder}` : undefined,
                                    color: theme?.inputTextColor || undefined,
                                    borderRadius: theme?.inputBorderRadius || undefined
                                }}
                            >
                                <SelectValue placeholder="Ban Type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Types</SelectItem>
                                <SelectItem value="GLOBAL">Global</SelectItem>
                                <SelectItem value="CATEGORY">Category</SelectItem>
                                <SelectItem value="INDIVIDUAL">Individual</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger
                                style={{
                                    backgroundColor: theme?.inputBackground || undefined,
                                    border: theme?.inputBorder ? `1px solid ${theme.inputBorder}` : undefined,
                                    color: theme?.inputTextColor || undefined,
                                    borderRadius: theme?.inputBorderRadius || undefined
                                }}
                            >
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="inactive">Inactive</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button 
                            onClick={fetchBans} 
                            variant="outline"
                            style={{
                                backgroundColor: theme?.buttonSecondaryBackground || undefined,
                                color: theme?.buttonSecondaryText || undefined,
                                border: theme?.buttonSecondaryBorder ? `1px solid ${theme.buttonSecondaryBorder}` : undefined,
                                borderRadius: theme?.buttonBorderRadius || undefined
                            }}
                        >
                            <Search className="h-4 w-4 mr-2" />
                            Search
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-between items-center">
                <p 
                    className="text-sm"
                    style={{ color: theme?.textMutedColor || "#9ca3af" }}
                >
                    Showing {bans.length} of {totalBans} bans
                </p>
                <div className="flex space-x-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(Math.max(1, page - 1))}
                        disabled={page === 1}
                        style={{
                            backgroundColor: theme?.buttonSecondaryBackground || undefined,
                            color: theme?.buttonSecondaryText || undefined,
                            border: theme?.buttonSecondaryBorder ? `1px solid ${theme.buttonSecondaryBorder}` : undefined,
                            borderRadius: theme?.buttonBorderRadius || undefined
                        }}
                    >
                        Previous
                    </Button>
                    <span 
                        className="px-3 py-1 text-sm"
                        style={{ color: theme?.textSecondaryColor || "#9ca3af" }}
                    >
                        Page {page} of {totalPages}
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(Math.min(totalPages, page + 1))}
                        disabled={page === totalPages}
                        style={{
                            backgroundColor: theme?.buttonSecondaryBackground || undefined,
                            color: theme?.buttonSecondaryText || undefined,
                            border: theme?.buttonSecondaryBorder ? `1px solid ${theme.buttonSecondaryBorder}` : undefined,
                            borderRadius: theme?.buttonBorderRadius || undefined
                        }}
                    >
                        Next
                    </Button>
                </div>
            </div>

            {loading ? (
                <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                        <Card 
                            key={i} 
                            className="animate-pulse"
                            style={{
                                backgroundColor: theme?.cardBackground || undefined,
                                border: theme?.cardBorder ? `1px solid ${theme.cardBorder}` : undefined,
                                borderRadius: theme?.cardBorderRadius || undefined,
                                boxShadow: theme?.cardShadow || undefined
                            }}
                        >
                            <CardContent className="p-6">
                                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : bans.length === 0 ? (
                <Card
                    style={{
                        backgroundColor: theme?.cardBackground || undefined,
                        border: theme?.cardBorder ? `1px solid ${theme.cardBorder}` : undefined,
                        borderRadius: theme?.cardBorderRadius || undefined,
                        boxShadow: theme?.cardShadow || undefined
                    }}
                >
                    <CardContent className="p-8 text-center">
                        <Ban className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                        <h3 
                            className="text-lg font-semibold mb-2"
                            style={{ color: theme?.textPrimaryColor || "#f2f4f6" }}
                        >
                            No bans found
                        </h3>
                        <p 
                            style={{ color: theme?.textMutedColor || "#9ca3af" }}
                        >
                            {searchTerm || banTypeFilter !== 'all' || statusFilter !== 'all'
                                ? 'Try adjusting your search filters'
                                : 'There are no bans to display'
                            }
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {bans.map((ban) => {
                        const banTypeColors = getBanTypeColor(ban.banType)
                        const statusColors = getStatusColor(ban.isActive)
                        
                        return (
                            <Card 
                                key={ban.id} 
                                className="hover:shadow-md transition-shadow"
                                style={{
                                    backgroundColor: theme?.cardBackground || undefined,
                                    border: theme?.cardBorder ? `1px solid ${theme.cardBorder}` : undefined,
                                    borderRadius: theme?.cardBorderRadius || undefined,
                                    boxShadow: theme?.cardShadow || undefined
                                }}
                            >
                                <CardContent className="p-6">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-3 mb-2">
                                                {(ban.user?.image || ban.user?.player?.avatar) && (
                                                    <Image
                                                        src={ban.user?.image || ban.user?.player?.avatar || ''}
                                                        alt={ban.user?.name || ban.user?.player?.username || 'User'}
                                                        width={32}
                                                        height={32}
                                                        className="h-8 w-8 rounded-full"
                                                    />
                                                )}
                                                <div>
                                                    <h3 
                                                        className="font-medium"
                                                        style={{ color: theme?.textPrimaryColor || "#f2f4f6" }}
                                                    >
                                                        {ban.user?.name || 
                                                         ban.user?.player?.username || 
                                                         (ban.userId.match(/^\d{17}$/) ? `Steam ID: ${ban.userId}` : 'Unknown User')}
                                                    </h3>
                                                    <p 
                                                        className="text-sm"
                                                        style={{ color: theme?.textMutedColor || "#9ca3af" }}
                                                    >
                                                        {ban.user?.email || 
                                                         ban.user?.player?.steam_id || 
                                                         (ban.userId.match(/^\d{17}$/) ? `${ban.userId}@steamcommunity.com` : '')}
                                                    </p>
                                                </div>
                                                <div className="flex space-x-2">
                                                    <Badge className={`${banTypeColors.background} ${banTypeColors.text}`}>
                                                        <div className="flex items-center space-x-1">
                                                            {getBanTypeIcon(ban.banType)}
                                                            <span>{ban.banType}</span>
                                                        </div>
                                                    </Badge>
                                                    <Badge className={`${statusColors.background} ${statusColors.text}`}>
                                                        {ban.isActive ? 'Active' : 'Inactive'}
                                                    </Badge>
                                                </div>
                                            </div>
                                            
                                            <div className="space-y-2">
                                                <p 
                                                    className="text-sm"
                                                    style={{ color: theme?.textSecondaryColor || "#9ca3af" }}
                                                >
                                                    <span 
                                                        className="font-medium"
                                                        style={{ color: theme?.textPrimaryColor || "#f2f4f6" }}
                                                    >
                                                        Reason:
                                                    </span> {ban.reason}
                                                </p>
                                                
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                                    <div className="flex items-center space-x-2">
                                                        <Clock className="h-4 w-4" />
                                                        <span style={{ color: theme?.textMutedColor || "#9ca3af" }}>
                                                            Created: {formatDate(ban.createdAt)}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <User className="h-4 w-4" />
                                                        <span style={{ color: theme?.textMutedColor || "#9ca3af" }}>
                                                            Banned by: {ban.admin.name}
                                                        </span>
                                                    </div>
                                                    {ban.expiresAt && (
                                                        <div className="flex items-center space-x-2">
                                                            <Clock className="h-4 w-4" />
                                                            <span style={{ color: theme?.textMutedColor || "#9ca3af" }}>
                                                                Expires: {formatExpiry(ban.expiresAt)}
                                                            </span>
                                                        </div>
                                                    )}
                                                    {ban.serverId && (
                                                        <div className="flex items-center space-x-2">
                                                            <Server className="h-4 w-4" />
                                                            <span style={{ color: theme?.textMutedColor || "#9ca3af" }}>
                                                                Server: {ban.serverId}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
