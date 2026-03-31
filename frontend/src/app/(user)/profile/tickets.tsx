'use client'

import * as React from "react"
import {
    ColumnDef,
    ColumnFiltersState,
    SortingState,
    VisibilityState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from "@tanstack/react-table"
import { ArrowUpDown } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { useProfileTheme } from "@/hooks/use-profile-theme"
import { withUserDefaults } from "@/lib/user-theme-defaults"

import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Ticket, TicketCategory } from "@/types/tickets";
import { backendApi } from "@/lib/api";
import { getAuthToken } from "@/lib/laravel-auth";
import { format } from "date-fns"
import Link from "next/link"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

type ProfileTicketsTheme = ReturnType<typeof withUserDefaults>

function createTicketColumns(theme: ProfileTicketsTheme): ColumnDef<Ticket>[] {
    const sortHeader = (column: { toggleSorting: (desc: boolean) => void; getIsSorted: () => false | "asc" | "desc" }, label: string) => (
        <Button
            variant="ghost"
            className="profile-theme-table-sort h-9 -ml-2 px-2 transition-opacity"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
            {label}
            <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
    )

    return [
        {
            accessorKey: "id",
            header: "Ticket ID",
            cell: ({ row }) => <div className="capitalize">#{row.getValue("id")}</div>,
        },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => (
                <Badge
                    variant={row.getValue("status") === "open" ? "active" : "destructive"}
                    className="capitalize select-none"
                >
                    {row.getValue("status")}
                </Badge>
            ),
        },
        {
            accessorKey: "category",
            header: "Title",
            cell: ({ row }) => <div>{row.getValue<Partial<TicketCategory>>("category")?.name}</div>,
        },
        {
            accessorKey: "updatedAt",
            header: ({ column }) => sortHeader(column, "Updated"),
            cell: ({ row }) => <div className="px-4">{format(new Date(row.getValue("updatedAt")), "MMM d, yyyy h:mm a")}</div>,
        },
        {
            accessorKey: "createdAt",
            header: ({ column }) => sortHeader(column, "Created"),
            cell: ({ row }) => <div className="px-4">{format(new Date(row.getValue("createdAt")), "MMM d, yyyy h:mm a")}</div>,
        },
        {
            id: "view",
            accessorKey: "id",
            header: "View",
            cell: ({ row }) => (
                <Link
                    href={`/ticket/${row.getValue("id")}`}
                    className={cn(
                        buttonVariants({
                            variant: "outline",
                            size: "sm",
                        }),
                        "w-full md:w-auto hover:opacity-90 transition-opacity",
                    )}
                    style={{
                        backgroundColor: theme.buttonSecondaryBackground,
                        color: theme.buttonSecondaryText,
                        border: `1px solid ${theme.buttonSecondaryBorder}`,
                        borderRadius: theme.buttonBorderRadius,
                    }}
                >
                    View
                </Link>
            ),
        },
    ]
}

interface TicketsProps {
    serverTheme?: any;
}

export default function Tickets({ serverTheme }: TicketsProps) {
    const { data: clientTheme } = useProfileTheme();

    const theme = React.useMemo(
        () => withUserDefaults(clientTheme || serverTheme),
        [clientTheme, serverTheme],
    )
    const columns = React.useMemo(() => createTicketColumns(theme), [theme])

    const [sorting, setSorting] = React.useState<SortingState>([])
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
    const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
    const [statusFilter, setStatusFilter] = React.useState<string>("all")

    const { data: tickets, isLoading } = useQuery<Ticket[]>({
        queryKey: ['tickets'],
        queryFn: async () => {
            const token = getAuthToken()
            const headers: Record<string, string> = { Accept: 'application/json' }
            if (token) headers['Authorization'] = `Bearer ${token}`
            const res = await fetch(backendApi('tickets'), { credentials: 'include', headers })
            if (!res.ok) return []
            return res.json()
        },
    })

    const table = useReactTable({
        data: tickets ?? [],
        columns,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onColumnVisibilityChange: setColumnVisibility,
        state: {
            sorting,
            columnFilters,
            columnVisibility,
        },
        filterFns: {
            status: (row, id, filterValue) => {
                return filterValue === "all" || row.getValue(id) === filterValue;
            },
        },
    })

    React.useEffect(() => {
        if (statusFilter !== "all") {
            table.getColumn("status")?.setFilterValue(statusFilter)
        } else {
            table.getColumn("status")?.setFilterValue(undefined)
        }
    }, [statusFilter, table])

    const filterToolbarStyle = {
        ["--profile-filter-bg" as string]: theme.profileFilterBackground,
        ["--profile-filter-border" as string]: theme.profileFilterBorder,
        ["--profile-filter-text" as string]: theme.profileFilterTextColor,
        ["--profile-filter-placeholder" as string]: theme.profileFilterPlaceholderColor,
        ["--profile-filter-ring" as string]: theme.linkColor,
        gap: theme.spacing,
    } as React.CSSProperties

    const dropdownSurfaceStyle = {
        ["--profile-dropdown-bg" as string]: theme.profileDropdownBackground,
        ["--profile-dropdown-border" as string]: theme.profileDropdownBorder,
        ["--profile-dropdown-text" as string]: theme.profileDropdownTextColor,
        ["--profile-dropdown-item-hover" as string]: theme.profileDropdownItemHoverBackground,
        borderRadius: theme.cardBorderRadius,
    } as React.CSSProperties

    const profileTableChromeStyle = {
        ["--profile-table-sort-text" as string]: theme.contentCardTitleColor,
        ["--profile-table-sort-hover-bg" as string]: theme.roleBadgeBackground,
        ["--profile-pagination-bg" as string]: theme.buttonSecondaryBackground,
        ["--profile-pagination-hover-bg" as string]: theme.profileDropdownItemHoverBackground,
        ["--profile-pagination-text" as string]: theme.buttonSecondaryText,
        ["--profile-pagination-border" as string]: theme.buttonSecondaryBorder,
        ["--profile-pagination-radius" as string]: theme.buttonBorderRadius,
        ["--profile-table-row-hover" as string]: theme.roleBadgeBackground,
    } as React.CSSProperties

    return (
        <Card
            className={cn(
                "mt-4 group relative backdrop-blur overflow-hidden hover:brightness-110 transition-all duration-300",
                "profile-theme-data-table",
            )}
            style={{
                backgroundColor: theme.contentCardBackground,
                border: `1px solid ${theme.contentCardBorder}`,
                borderRadius: theme.cardBorderRadius,
                boxShadow: theme.cardShadow,
                ...profileTableChromeStyle,
            }}
        >
            <CardContent style={{ padding: theme.cardPadding }}>
                <div
                    className="profile-theme-filter-toolbar py-4 flex flex-col md:flex-row items-center justify-between"
                    style={filterToolbarStyle}
                >
                    <Input
                        placeholder="Filter Tickets..."
                        value={(table.getColumn("id")?.getFilterValue() as string) ?? ""}
                        onChange={(event) =>
                            table.getColumn("id")?.setFilterValue(event.target.value)
                        }
                        className={cn(
                            "profile-theme-filter-control md:max-w-sm h-10 px-3 py-2 text-sm shadow-none ring-0 border-0 focus-visible:ring-0 focus-visible:ring-offset-0",
                        )}
                        style={{ borderRadius: theme.inputBorderRadius }}
                    />
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger
                            className="profile-theme-filter-trigger w-full md:w-[180px] h-10 px-3 py-2 text-sm shadow-none ring-0 border-0 focus:ring-0 focus:ring-offset-0 data-[state=open]:ring-0"
                            style={{ borderRadius: theme.inputBorderRadius }}
                        >
                            <SelectValue placeholder="Filter by Status" />
                        </SelectTrigger>
                        <SelectContent
                            className="profile-theme-dropdown-content backdrop-blur z-[100]"
                            style={dropdownSurfaceStyle}
                        >
                            <SelectItem value="all">All</SelectItem>
                            <SelectItem value="open">Open</SelectItem>
                            <SelectItem value="closed">Closed</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div
                    className="rounded-md overflow-hidden border"
                    style={{ borderColor: theme.contentCardBorder }}
                >
                    <Table style={{ color: theme.contentCardTitleColor }}>
                        <TableHeader>
                            {table.getHeaderGroups().map((headerGroup) => (
                                <TableRow
                                    key={headerGroup.id}
                                    className="hover:bg-transparent"
                                    style={{
                                        backgroundColor: theme.roleBadgeBackground,
                                        borderColor: theme.contentCardBorder,
                                    }}
                                >
                                    {headerGroup.headers.map((header) => {
                                        return (
                                            <TableHead
                                                key={header.id}
                                                style={{ color: theme.contentCardTitleColor }}
                                            >
                                                {header.isPlaceholder
                                                    ? null
                                                    : flexRender(
                                                          header.column.columnDef.header,
                                                          header.getContext(),
                                                      )}
                                            </TableHead>
                                        )
                                    })}
                                </TableRow>
                            ))}
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, index) => (
                                    <TableRow
                                        key={index}
                                        style={{ borderColor: theme.contentCardBorder }}
                                    >
                                        {columns.map((column, cellIndex) => (
                                            <TableCell key={cellIndex}>
                                                <Skeleton className="h-6 w-full opacity-40" />
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : table.getRowModel().rows?.length ? (
                                table.getRowModel().rows.map((row) => (
                                    <TableRow
                                        key={row.id}
                                        data-state={row.getIsSelected() && "selected"}
                                        style={{ borderColor: theme.contentCardBorder }}
                                    >
                                        {row.getVisibleCells().map((cell) => (
                                            <TableCell key={cell.id}>
                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell
                                        colSpan={columns.length}
                                        className="h-24 text-center"
                                        style={{ color: theme.contentCardDescriptionColor }}
                                    >
                                        No results.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
                <div className="flex items-center justify-end space-x-2 py-4">
                    <div
                        className="flex-1 text-sm"
                        style={{ color: theme.contentCardDescriptionColor }}
                    >
                        {isLoading
                            ? "Loading tickets..."
                            : `${table.getFilteredRowModel().rows.length} ticket(s) total.`}
                    </div>
                    <div className="space-x-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="profile-theme-table-page transition-opacity"
                            onClick={() => table.previousPage()}
                            disabled={!table.getCanPreviousPage()}
                        >
                            Previous
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="profile-theme-table-page transition-opacity"
                            onClick={() => table.nextPage()}
                            disabled={!table.getCanNextPage()}
                        >
                            Next
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
