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
import { ArrowUpDown, Check, Copy } from "lucide-react"
import Image from 'next/image'
import { useProfileTheme } from "@/hooks/use-profile-theme"
import { withUserDefaults } from "@/lib/user-theme-defaults"

import { Button } from "@/components/ui/button"
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"
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
import { useOrders } from "@/hooks/store/use-storefront"
import { Order, OrderLine } from "@/types/store"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type ProfileTransactionsTheme = ReturnType<typeof withUserDefaults>

function CopyButton({ text, theme }: { text: string; theme: ProfileTransactionsTheme }) {
  const [copied, setCopied] = React.useState(false)

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

function createTransactionColumns(theme: ProfileTransactionsTheme): ColumnDef<Order>[] {
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
      header: "Order ID",
      cell: ({ row }) => (
        <div className="flex items-center space-x-2">
          <span className="capitalize">{row.getValue("id")}</span>
          <CopyButton text={String(row.getValue("id"))} theme={theme} />
        </div>
      ),
    },
    {
      accessorKey: "lines",
      header: "Items",
      cell: ({ row }) => (
        <HoverCard closeDelay={750} openDelay={250}>
          <HoverCardTrigger
            className="hover:opacity-90 cursor-pointer transition-opacity"
            style={{ color: theme.linkColor }}
          >
            View {row.getValue<OrderLine[]>("lines").length} item{row.getValue<OrderLine[]>("lines").length > 1 ? "(s)" : null}
          </HoverCardTrigger>
          <HoverCardContent
            className="backdrop-blur space-y-2"
            style={{
              backgroundColor: theme.contentCardBackground,
              border: `1px solid ${theme.contentCardBorder}`,
              borderRadius: theme.cardBorderRadius,
              color: theme.contentCardTitleColor,
              boxShadow: theme.cardShadow,
            }}
          >
            {row.getValue<OrderLine[]>("lines").map((line) => (
              <div className="flex items-center gap-2 text-sm" key={line.product_id}>
                <Image
                  src={typeof line?.product_image_url === "string" ? line.product_image_url : "/images/placeholder.png"}
                  height={50}
                  width={50}
                  alt={line.product_name || "Product image"}
                  className="object-cover rounded-md"
                />
                <span style={{ color: theme.contentCardDescriptionColor }}>
                  {line.product_name} {typeof line.total_amount_str === "string" ? line.total_amount_str : ""}
                </span>
              </div>
            ))}
          </HoverCardContent>
        </HoverCard>
      ),
    },
    {
      accessorKey: "total_amount_str",
      header: ({ column }) => sortHeader(column, "Price"),
      cell: ({ row }) => {
        const order = row.original
        const currencyPaid = order.presentment_currency ?? order.currency
        const amountStr = order.presentment_total_amount_str ?? order.total_amount_str
        return (
          <div className="lowercase px-4">
            {typeof amountStr === "string" ? amountStr : ""}{" "}
            <span className="uppercase">{typeof currencyPaid === "string" ? currencyPaid : ""}</span>
          </div>
        )
      },
      sortingFn: (rowA, rowB) =>
        (typeof rowA.original.total_amount === "number" ? rowA.original.total_amount : 0) -
        (typeof rowB.original.total_amount === "number" ? rowB.original.total_amount : 0),
    },
    {
      accessorKey: "created_at",
      header: ({ column }) => sortHeader(column, "Purchased On"),
      cell: ({ row }) => <div className="px-4">{new Date(row.getValue("created_at")).toDateString()}</div>,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge
          variant={row.getValue("status") === "completed" ? "active" : "destructive"}
          className={cn(
            "capitalize select-none",
            { "bg-muted text-muted-foreground border-border": row.getValue("status") === "canceled" },
            {
              "bg-destructive/10 hover:bg-destructive/20 border-destructive text-destructive":
                row.getValue("status") === "chargeback",
            },
          )}
        >
          {row.getValue("status")}
        </Badge>
      ),
    },
  ]
}

interface TransactionsProps {
  serverTheme?: any
}

export default function Transactions({ serverTheme }: TransactionsProps) {
  const { data: clientTheme } = useProfileTheme()

  const theme = React.useMemo(
    () => withUserDefaults(clientTheme || serverTheme),
    [clientTheme, serverTheme],
  )
  const columns = React.useMemo(() => createTransactionColumns(theme), [theme])

  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [statusFilter, setStatusFilter] = React.useState<string>("all")
  const orderHistory = useOrders()

  const table = useReactTable({
    data: orderHistory.isSuccess ? orderHistory.data : [],
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
        return filterValue === "all" || row.getValue(id) === filterValue
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
            placeholder="Filter Orders..."
            value={(table.getColumn("id")?.getFilterValue() as string) ?? ""}
            onChange={(event) => table.getColumn("id")?.setFilterValue(event.target.value)}
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
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="canceled">Canceled</SelectItem>
              <SelectItem value="chargeback">Chargeback</SelectItem>
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
              {orderHistory.isLoading ? (
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
            {orderHistory.isLoading
              ? "Loading transactions..."
              : `${table.getFilteredRowModel().rows.length} transaction(s) total.`}
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
