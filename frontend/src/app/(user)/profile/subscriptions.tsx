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
import { ArrowUpDown, ChevronDown, Copy, Check } from "lucide-react"

import { Button } from "@/components/ui/button"
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
import { useCancelSubscriptionMutation, useSubscriptions } from "@/hooks/store/use-storefront"
import { Subscription } from "@/types/store"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useState } from "react"
import Image from "next/image"
import { Skeleton } from "@/components/ui/skeleton"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useProfileTheme } from "@/hooks/use-profile-theme"
import { withUserDefaults } from "@/lib/user-theme-defaults"
import { cn } from "@/lib/utils"

type ProfileSubscriptionsTheme = ReturnType<typeof withUserDefaults>

function CopyButton({ text, theme }: { text: string; theme: ProfileSubscriptionsTheme }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleCopy}
      className="w-8 h-8 p-0 hover:opacity-80 transition-opacity"
      style={{
        backgroundColor: theme.copyButtonBackground,
        color: theme.copyButtonText,
        borderRadius: theme.buttonBorderRadius,
      }}
    >
      {copied ? (
        <Check className="h-4 w-4" style={{ color: theme.buttonSuccessBackground }} />
      ) : (
        <Copy className="h-4 w-4" />
      )}
    </Button>
  )
}

function CancelButton({
  id,
  status,
  theme,
}: {
  id: string
  status: string
  theme: ProfileSubscriptionsTheme
}) {
  const { mutate, isPending } = useCancelSubscriptionMutation()
  const [isOpen, setIsOpen] = useState(false)

  const handleCancel = () => {
    mutate(id)
    setIsOpen(false)
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant="destructive"
          size="sm"
          disabled={isPending || status === "canceled"}
          className="hover:opacity-90 transition-opacity"
          style={{
            backgroundColor: theme.buttonDestructiveBackground,
            color: theme.buttonDestructiveText,
            borderRadius: theme.buttonBorderRadius,
          }}
        >
          {isPending ? "Canceling..." : status === "canceled" ? "Canceled" : "Cancel"}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent
        className="backdrop-blur"
        style={{
          backgroundColor: theme.contentCardBackground,
          border: `1px solid ${theme.contentCardBorder}`,
          borderRadius: theme.cardBorderRadius,
        }}
      >
        <AlertDialogHeader>
          <AlertDialogTitle style={{ color: theme.contentCardTitleColor }}>Confirm Cancellation</AlertDialogTitle>
          <AlertDialogDescription style={{ color: theme.contentCardDescriptionColor }}>
            Are you sure you want to cancel this subscription? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            className="hover:opacity-90 transition-opacity"
            style={{
              backgroundColor: theme.buttonSecondaryBackground,
              color: theme.buttonSecondaryText,
              border: `1px solid ${theme.buttonSecondaryBorder}`,
              borderRadius: theme.buttonBorderRadius,
            }}
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleCancel}
            className="hover:opacity-90 transition-opacity"
            style={{
              backgroundColor: theme.buttonDestructiveBackground,
              color: theme.buttonDestructiveText,
              borderRadius: theme.buttonBorderRadius,
            }}
          >
            Confirm Cancellation
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

function createSubscriptionColumns(theme: ProfileSubscriptionsTheme): ColumnDef<Subscription>[] {
  const sortHeader = (
    column: { toggleSorting: (desc: boolean) => void; getIsSorted: () => false | "asc" | "desc" },
    label: string,
  ) => (
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
      header: "Subscription ID",
      cell: ({ row }) => (
        <div className="flex items-center space-x-2">
          <span>{row.getValue("id")}</span>
          <CopyButton text={String(row.getValue("id"))} theme={theme} />
        </div>
      ),
    },
    {
      accessorKey: "product_name",
      header: "Product",
      cell: ({ row }) => (
        <div className="flex items-center space-x-3">
          <Image
            src={row.original.product_image_url ?? "/images/placeholder.png"}
            alt={String(row.getValue("product_name"))}
            width={40}
            height={40}
            className="rounded-md object-cover"
          />
          <span>{row.getValue("product_name")}</span>
        </div>
      ),
    },
    {
      accessorKey: "total_amount_str",
      header: ({ column }) => sortHeader(column, "Price"),
      cell: ({ row }) => <div className="px-4">{row.getValue("total_amount_str")}</div>,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant={row.getValue("status") === "active" ? "active" : "destructive"} className="capitalize">
          {row.getValue("status")}
        </Badge>
      ),
    },
    {
      accessorKey: "billingPeriod",
      header: "Billing Period",
      cell: ({ row }) => {
        const intervalValue = row.original.interval_value ?? 0
        const intervalScale = row.original.interval_scale
        const plural = intervalValue > 1 ? "s" : ""
        return <div>{`${intervalValue} ${intervalScale}${plural}`}</div>
      },
    },
    {
      accessorKey: "created_at",
      header: ({ column }) => sortHeader(column, "Subscribed On"),
      cell: ({ row }) => <div className="px-4">{new Date(row.getValue("created_at")).toDateString()}</div>,
    },
    {
      id: "cancel",
      cell: ({ row }) => (
        <CancelButton id={row.original.id} status={String(row.getValue("status"))} theme={theme} />
      ),
    },
  ]
}

interface SubscriptionsProps {
  serverTheme?: any
}

export default function Subscriptions({ serverTheme }: SubscriptionsProps) {
  const { data: clientTheme } = useProfileTheme()

  const theme = React.useMemo(
    () => withUserDefaults(clientTheme || serverTheme),
    [clientTheme, serverTheme],
  )
  const columns = React.useMemo(() => createSubscriptionColumns(theme), [theme])

  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const { data: subscriptions, isLoading, isSuccess } = useSubscriptions()

  const table = useReactTable({
    data: isSuccess ? subscriptions : [],
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
  })

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
            placeholder="Filter Subscriptions..."
            value={(table.getColumn("id")?.getFilterValue() as string) ?? ""}
            onChange={(event) => table.getColumn("id")?.setFilterValue(event.target.value)}
            className={cn(
              "profile-theme-filter-control md:max-w-sm h-10 px-3 py-2 text-sm shadow-none ring-0 border-0 focus-visible:ring-0 focus-visible:ring-offset-0",
            )}
            style={{ borderRadius: theme.inputBorderRadius }}
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="profile-theme-filter-trigger inline-flex items-center justify-center gap-0 whitespace-nowrap font-medium transition-opacity w-full md:w-auto h-10 px-3 py-2 text-sm shadow-none ring-0 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 data-[state=open]:ring-0 disabled:pointer-events-none disabled:opacity-50"
                style={{ borderRadius: theme.inputBorderRadius }}
              >
                Filter Status <ChevronDown className="ml-2 h-4 w-4 shrink-0" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="profile-theme-dropdown-content backdrop-blur z-[100]"
              style={dropdownSurfaceStyle}
            >
              <DropdownMenuCheckboxItem
                checked={table.getColumn("status")?.getFilterValue() === "active"}
                onCheckedChange={() => table.getColumn("status")?.setFilterValue("active")}
              >
                Active
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={table.getColumn("status")?.getFilterValue() === "canceled"}
                onCheckedChange={() => table.getColumn("status")?.setFilterValue("canceled")}
              >
                Canceled
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} style={{ color: theme.contentCardTitleColor }}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={index} style={{ borderColor: theme.contentCardBorder }}>
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
          <div className="flex-1 text-sm" style={{ color: theme.contentCardDescriptionColor }}>
            {isLoading
              ? "Loading subscriptions..."
              : `${table.getFilteredRowModel().rows.length} subscription(s) total.`}
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
