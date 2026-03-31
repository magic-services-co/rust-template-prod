"use client";

import React, { useEffect, useMemo } from 'react'
import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    useReactTable,
    getPaginationRowModel,
    SortingState,
    Row,
    Column,
    OnChangeFn,
} from "@tanstack/react-table"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    ArrowUp,
    ArrowDown,
    Filter,
    Search,
    Skull,
    Trophy,
} from "lucide-react"

import { parseAsInteger, useQueryState } from 'nuqs';
import { cn } from "@/lib/utils";
import { useStatsQuery } from '@/hooks/leaderboard-hooks';
import useServers from '@/hooks/use-servers';
import { useSession } from '@/lib/laravel-auth-react';
import { useLeaderboardTheme } from '@/hooks/use-leaderboard-theme';
import { withLeaderboardDefaults } from '@/lib/leaderboard-theme-defaults';
import { LeaderboardColumn } from '@/hooks/use-leaderboard-tabs';
import Link from 'next/link';
import { useDebouncedCallback } from 'use-debounce';
import { ServerCombobox } from '../server-combobox';
import { WipeCombobox } from '../wipe-combobox';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { formatDuration, intervalToDuration } from "date-fns";
import Image from 'next/image';
import { lootyWeaponImageUrl } from '@/lib/looty-item-image';
import { useWipes } from '@/hooks/use-wipes';
import { useLeaderboardSettings } from '@/hooks/use-leaderboard-settings';

type LeaderboardThemeMerged = ReturnType<typeof withLeaderboardDefaults>

const LEFT_ALIGN_IDS = new Set(["rank", "player", "time_played"])

function PlayerCell({
    row,
    theme,
}: {
    row: Record<string, unknown>;
    theme: LeaderboardThemeMerged;
}) {
    const username = String(row.username ?? "Unknown");
    const sid = String(row.steam_id ?? "");
    return (
        <div className="flex items-center gap-2 text-left">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-zinc-600/80 to-zinc-900 text-xs font-bold text-white shadow-inner">
                {username.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
                <Link
                    href={`https://steamcommunity.com/profiles/${sid}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block truncate text-sm font-semibold hover:underline"
                    style={{ color: theme.linkColor }}
                >
                    {username}
                </Link>
                <div className="truncate font-mono text-[10px] text-zinc-500">{sid}</div>
            </div>
        </div>
    );
}

function FavoriteWeaponCell({
    row,
    theme,
}: {
    row: Record<string, unknown>;
    theme: LeaderboardThemeMerged;
}) {
    const raw = row.favorite_weapon;
    const kills = Number(row.favorite_weapon_kills) || 0;
    const src = lootyWeaponImageUrl(raw);
    const numericUnknown =
        raw != null &&
        raw !== "" &&
        !src &&
        (typeof raw === "number" ||
            (typeof raw === "string" && /^\d+$/.test(raw.trim())));

    if (!src) {
        if (numericUnknown) {
            return (
                <span className="font-mono text-xs text-zinc-500" title="Unknown item id">
                    {String(raw)}
                </span>
            );
        }
        return <span className="text-zinc-600">—</span>;
    }

    return (
        <div className="inline-flex max-w-full items-center gap-1.5 rounded-md bg-zinc-800/90 px-2 py-1 ring-1 ring-white/10">
            <div className="relative h-6 w-14 shrink-0 md:h-7 md:w-16">
                <Image
                    src={src}
                    alt=""
                    fill
                    className="object-contain object-left"
                    sizes="80px"
                />
            </div>
            <Skull className="h-3.5 w-3.5 shrink-0 text-red-500" aria-hidden />
            <span
                className="min-w-[2ch] shrink-0 tabular-nums text-xs font-semibold"
                style={{ color: theme.textPrimaryColor }}
            >
                {kills}
            </span>
        </div>
    );
}

type GetColumnsOpts = {
    page: number;
    pageSize: number;
    lockSort: boolean;
    tab: string;
    dataColumns: LeaderboardColumn[];
};

const getColumns = (
    theme: LeaderboardThemeMerged,
    opts: GetColumnsOpts,
): ColumnDef<Record<string, any>>[] => {
    const { page, pageSize, lockSort, tab, dataColumns } = opts;

    const sortHeader = (
        column: Column<Record<string, any>, unknown>,
        columnData: LeaderboardColumn,
        label: React.ReactNode,
    ) =>
        columnData.icon ? (
            <TooltipProvider delayDuration={300}>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            type="button"
                            variant="ghost"
                            disabled={lockSort}
                            onClick={() => {
                                if (!lockSort) column.toggleSorting(column.getIsSorted() === "asc");
                            }}
                            className="h-8 -ml-2 px-1.5 hover:bg-white/5"
                            style={{ color: theme.textPrimaryColor }}
                        >
                            <div className="relative h-5 w-5">
                                <Image
                                    src={
                                        columnData.icon.includes("http")
                                            ? columnData.icon
                                            : `/images/icons/${columnData.icon}`
                                    }
                                    alt={columnData.columnLabel}
                                    fill
                                    className="object-contain"
                                    sizes="20px"
                                />
                            </div>
                            {column.getIsSorted() === "asc" ? (
                                <ArrowUp className="ml-2 h-4 w-4" />
                            ) : column.getIsSorted() === "desc" ? (
                                <ArrowDown className="ml-2 h-4 w-4" />
                            ) : null}
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>{columnData.columnLabel}</TooltipContent>
                </Tooltip>
            </TooltipProvider>
        ) : (
            <Button
                type="button"
                variant="ghost"
                disabled={lockSort}
                onClick={() => {
                    if (!lockSort) column.toggleSorting(column.getIsSorted() === "asc");
                }}
                className="h-8 -ml-2 px-1.5 text-xs hover:bg-white/5"
                style={{ color: theme.textPrimaryColor }}
            >
                {label}
                {column.getIsSorted() === "asc" ? (
                    <ArrowUp className="ml-2 h-4 w-4" />
                ) : column.getIsSorted() === "desc" ? (
                    <ArrowDown className="ml-2 h-4 w-4" />
                ) : null}
            </Button>
        );

    const rankCol: ColumnDef<Record<string, any>> = {
        id: "rank",
        accessorFn: () => "",
        header: "#",
        cell: ({ row }) => {
            const globalRank = (page - 1) * pageSize + row.index + 1;
            const medalClass =
                globalRank === 1
                    ? "font-semibold text-amber-400 tabular-nums transition-colors duration-200 group-hover:text-amber-200 group-hover:drop-shadow-[0_0_10px_rgba(251,191,36,0.45)]"
                    : globalRank === 2
                      ? "font-semibold text-slate-300 tabular-nums transition-colors duration-200 group-hover:text-slate-50 group-hover:drop-shadow-[0_0_8px_rgba(226,232,240,0.35)]"
                      : globalRank === 3
                        ? "font-semibold text-[#CD7F32] tabular-nums transition-colors duration-200 group-hover:text-[#E8A86A] group-hover:drop-shadow-[0_0_8px_rgba(205,127,50,0.4)]"
                        : "text-zinc-500 tabular-nums transition-colors duration-200 group-hover:text-zinc-400";
            return (
                <span className={cn("font-mono text-xs", medalClass)}>#{globalRank}</span>
            );
        },
        enableSorting: false,
    };

    const playerCol: ColumnDef<Record<string, any>> = {
        id: "player",
        header: "Player",
        accessorFn: (r) => r.username,
        cell: ({ row }) => <PlayerCell row={row.original} theme={theme} />,
        enableSorting: false,
    };

    const timeCol: ColumnDef<Record<string, any>> = {
        id: "time_played",
        accessorKey: "time_played",
        header: ({ column }) => (
            <Button
                type="button"
                variant="ghost"
                disabled={lockSort || tab !== "misc_stats"}
                onClick={() => {
                    if (!lockSort && tab === "misc_stats") {
                        column.toggleSorting(column.getIsSorted() === "asc");
                    }
                }}
                className="h-8 -ml-2 px-1.5 text-xs hover:bg-white/5"
                style={{ color: theme.textPrimaryColor }}
            >
                Time played
                {tab === "misc_stats" && column.getIsSorted() === "asc" ? (
                    <ArrowUp className="ml-2 h-4 w-4" />
                ) : tab === "misc_stats" && column.getIsSorted() === "desc" ? (
                    <ArrowDown className="ml-2 h-4 w-4" />
                ) : null}
            </Button>
        ),
        cell: ({ row }) => {
            const v = row.original.time_played;
            if (v == null || v === "") {
                return <span className="text-zinc-600">—</span>;
            }
            return (
                <div className="text-xs tabular-nums text-zinc-200">
                    {renderValue(
                        { columnKey: "time_played", columnLabel: "Time played" },
                        v,
                    )}
                </div>
            );
        },
        enableSorting: tab === "misc_stats",
        sortingFn: "basic",
    };

    const metricCols = dataColumns.map(
        (columnData) =>
            ({
                accessorKey: columnData.columnKey,
                id: columnData.columnKey,
                header: ({ column }: { column: Column<Record<string, any>, unknown> }) =>
                    sortHeader(column, columnData, columnData.columnLabel),
                cell: ({ row }: { row: Row<Record<string, any>> }) =>
                    columnData.columnKey === "favorite_weapon" ? (
                        <div className="flex items-center justify-center">
                            <FavoriteWeaponCell row={row.original} theme={theme} />
                        </div>
                    ) : (
                        <div className="flex items-center justify-center gap-1">
                            {columnData.columnKey === "kdr" ? (
                                <Trophy className="h-3.5 w-3.5 shrink-0 text-amber-500/90" aria-hidden />
                            ) : null}
                            <span className="tabular-nums">
                                {renderValue(columnData, row.getValue(columnData.columnKey))}
                            </span>
                        </div>
                    ),
            }) satisfies ColumnDef<Record<string, any>>,
    );

    return [
        {
            accessorKey: "steam_id",
            header: "Steam ID",
            cell: ({ row }: { row: Row<Record<string, any>> }) => <div>{row.getValue("steam_id")}</div>,
            enableHiding: true,
            enableSorting: false,
        },
        rankCol,
        playerCol,
        timeCol,
        ...metricCols,
    ];
}

function renderValue(columnData: LeaderboardColumn, value: any) {
    if (columnData.columnKey === "kdr") {
        return Number(value).toFixed(2)
    }
    if (columnData.columnKey === "favorite_weapon") {
        return value == null || value === "" ? "—" : String(value);
    }
    if (columnData.columnKey === "time_played") {
        const duration = intervalToDuration({ start: 0, end: value * 1000 });
        return formatDuration(duration, {
            format: value >= 86400 ? ['days', 'hours'] :
                value >= 3600 ? ['hours', 'minutes'] :
                    ['minutes', 'seconds'],
            zero: false,
            delimiter: ' '
        });
    }
    return value
}

export function StatsTable({
    tab,
    columnData,
    leaderboardTheme: serverTheme,
    isActive = true,
    hideFilterCard = false,
    lockSort = false,
}: {
    tab: string;
    columnData: LeaderboardColumn[];
    leaderboardTheme?: any;
    isActive?: boolean;
    hideFilterCard?: boolean;
    lockSort?: boolean;
}) {
    const { data: session } = useSession();
    const { data: clientTheme } = useLeaderboardTheme();
    const { data: leaderboardSettings } = useLeaderboardSettings();
    const [selectedServer, setSelectedServer] = useQueryState('server');
    const [selectedWipeId, setSelectedWipeId] = useQueryState('wipeId', parseAsInteger);
    
    const showWipeSelection = leaderboardSettings?.showWipeSelection ?? true;
    const lifetime = !showWipeSelection || selectedWipeId === -1;
    
    const leaderboardTheme = useMemo(
        () => withLeaderboardDefaults(clientTheme || serverTheme),
        [clientTheme, serverTheme],
    );
    const [searchQuery, setSearchQuery] = useQueryState('filter', {
        defaultValue: '',
        shallow: false,
        clearOnDefault: true,
    });
    const [sortingQuery, setSortingQuery] = useQueryState('sort');
    const [sortOrder, setSortOrder] = useQueryState('sortOrder');
    const [page, setPage] = useQueryState('page', parseAsInteger.withDefault(1));
    const [pageSize, setPageSize] = useQueryState('pageSize', parseAsInteger.withDefault(10));

    const { data: servers, ...serversQuery } = useServers();
    const { data: wipesData } = useWipes(selectedServer ? selectedServer : undefined, false);
    const wipes = useMemo(() => wipesData?.data || [], [wipesData?.data]);

    useEffect(() => {
        if (servers && servers.length > 0 && !selectedServer) {
            const firstServer = servers[0]?.servers?.[0];
            if (firstServer) {
                setSelectedServer(firstServer.server_id);
            }
        }
    }, [servers, selectedServer, setSelectedServer]);

    useEffect(() => {
        if (selectedWipeId === -1) {
            return;
        }
        
        if (selectedServer && wipes.length > 0) {
            const activeWipe = wipes.find(w => w.is_active);
            const latestWipe = wipes.sort((a, b) => 
                new Date(b.started_at ?? 0).getTime() - new Date(a.started_at ?? 0).getTime()
            )[0];
            
            const wipeToSelect = activeWipe || latestWipe;
            const selectedWipeExists = selectedWipeId != null && wipes.some(w => w.id === selectedWipeId);
            
            if (wipeToSelect && !selectedWipeExists) {
                setSelectedWipeId(wipeToSelect.id);
            }
        } else if (!selectedServer) {
            setSelectedWipeId(null);
        }
    }, [selectedServer, wipes, selectedWipeId, setSelectedWipeId]);

    const debouncedSetSearchQuery = useDebouncedCallback(setSearchQuery, 300);

    const { data, error, isLoading } = useStatsQuery({
        tab,
        filter: searchQuery || undefined,
        page: page ? +page : 1,
        sortField: sortingQuery || undefined,
        pageSize: +pageSize,
        server: selectedServer || '',
        wipeId: lifetime ? undefined : (selectedWipeId || undefined),
        lifetime: lifetime,
        sortOrder: sortOrder ? (
            sortOrder.toUpperCase() === "DESC" ? "DESC" : "ASC"
        ) : undefined,
    });

    const sorting = React.useMemo((): SortingState => {
        if (!sortingQuery) return [];
        return [{ id: sortingQuery, desc: !sortOrder || sortOrder.toLowerCase() === 'desc' }];
    }, [sortingQuery, sortOrder]);

    const setSorting = (newSorting: SortingState) => {
        if (!newSorting.length) return;
        setSortingQuery(newSorting[0].id);
        setSortOrder(newSorting[0].desc ? 'desc' : 'asc')
    };

    useEffect(() => {
        setPage(1);
    }, [searchQuery, sortingQuery, sortOrder, selectedServer, selectedWipeId, tab, setPage]);

    useEffect(() => {
        if (!isActive || !sortingQuery) return;
        const isValidSort = columnData.some(column => column.columnKey === sortingQuery);
        const timeSortOk = tab === "misc_stats" && sortingQuery === "time_played";
        if (!isValidSort && !timeSortOk) {
            setSortingQuery(null);
            setSortOrder(null);
        }
    }, [isActive, tab, columnData, sortingQuery, setSortingQuery, setSortOrder]);

    const handleSortingChange: OnChangeFn<SortingState> = (updaterOrValue) => {
        if (lockSort) {
            return;
        }
        const newSorting = typeof updaterOrValue === 'function'
            ? updaterOrValue(sorting)
            : updaterOrValue;
        setSorting(newSorting);
    };

    const dataColumns = useMemo(
        () => columnData.filter((c) => c.columnKey !== "time_played"),
        [columnData],
    );

    const columns = useMemo(
        () =>
            getColumns(leaderboardTheme, {
                page,
                pageSize,
                lockSort,
                tab,
                dataColumns,
            }),
        [
            leaderboardTheme,
            page,
            pageSize,
            lockSort,
            tab,
            dataColumns,
        ],
    );
    const table = useReactTable({
        data: data?.data ?? [],
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        onSortingChange: handleSortingChange,
        manualPagination: true,
        manualSorting: true,
        manualFiltering: true,
        pageCount: data?.totalPages || 1,
        state: {
            sorting,
            pagination: {
                pageIndex: page - 1,
                pageSize: pageSize,
            },
            columnVisibility: {
                steam_id: false,
            },
        },
        initialState: {
            /* pagination: {
                pageSize: 10,
            }, */
            columnVisibility: {
                steam_id: false, 
            },
        },
    })

    const inputControlStyle = useMemo(
        () =>
            ({
                backgroundColor: leaderboardTheme.inputBackground,
                border: leaderboardTheme.inputBorder
                    ? `1px solid ${leaderboardTheme.inputBorder}`
                    : undefined,
                color: leaderboardTheme.inputTextColor,
                borderRadius: leaderboardTheme.inputBorderRadius,
            }) as React.CSSProperties,
        [leaderboardTheme],
    )

    const secondaryButtonStyle = useMemo(
        () =>
            ({
                backgroundColor: leaderboardTheme.buttonSecondaryBackground,
                color: leaderboardTheme.buttonSecondaryText,
                border: leaderboardTheme.buttonSecondaryBorder
                    ? `1px solid ${leaderboardTheme.buttonSecondaryBorder}`
                    : undefined,
                borderRadius: leaderboardTheme.buttonBorderRadius,
            }) as React.CSSProperties,
        [leaderboardTheme],
    )

    const primaryButtonStyle = useMemo(
        () =>
            ({
                backgroundColor: leaderboardTheme.buttonPrimaryBackground,
                color: leaderboardTheme.buttonPrimaryText,
                border: `1px solid ${leaderboardTheme.buttonPrimaryBackground}`,
                borderRadius: leaderboardTheme.buttonBorderRadius,
            }) as React.CSSProperties,
        [leaderboardTheme],
    )

    const searchCardStyle = useMemo(
        () =>
            ({
                backgroundColor: leaderboardTheme.searchBackground,
                border: leaderboardTheme.searchBorder
                    ? `1px solid ${leaderboardTheme.searchBorder}`
                    : undefined,
                borderRadius: leaderboardTheme.searchBorderRadius,
            }) as React.CSSProperties,
        [leaderboardTheme],
    )

    const tableCardStyle = useMemo(
        () =>
            ({
                backgroundColor: leaderboardTheme.cardBackground,
                border: leaderboardTheme.cardBorder
                    ? `1px solid ${leaderboardTheme.cardBorder}`
                    : undefined,
                borderRadius: leaderboardTheme.cardBorderRadius,
                boxShadow: leaderboardTheme.cardShadow,
            }) as React.CSSProperties,
        [leaderboardTheme],
    )

    const tableBorderColor = leaderboardTheme.cardBorder ?? leaderboardTheme.inputBorder

    const comboboxTriggerClass =
        "w-full justify-between h-10 px-3 py-2 text-sm border shadow-none ring-offset-background"

    return (
        <div className="space-y-6">
            {!hideFilterCard ? (
                <Card style={searchCardStyle}>
                    <CardHeader>
                        <CardTitle
                            className="flex items-center space-x-2"
                            style={{ color: leaderboardTheme.textPrimaryColor }}
                        >
                            <Filter className="h-5 w-5" />
                            <span>Search & filters</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                            <div className="relative xl:col-span-2">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                <Input
                                    type="search"
                                    value={searchQuery ?? ""}
                                    placeholder="Search by Username or SteamID..."
                                    className="h-10 pl-10"
                                    style={inputControlStyle}
                                    onChange={(e) => debouncedSetSearchQuery(e.target.value)}
                                />
                            </div>
                            <div className="min-w-0">
                                <ServerCombobox
                                    allowGlobal={false}
                                    value={selectedServer}
                                    triggerClassName={comboboxTriggerClass}
                                    triggerStyle={inputControlStyle}
                                    onChange={(currentValue) => {
                                        setSelectedServer(currentValue);
                                    }}
                                />
                            </div>
                            {showWipeSelection && (
                                <div className="min-w-0">
                                    {selectedServer ? (
                                        <WipeCombobox
                                            value={selectedWipeId}
                                            onChange={(wipeId) => {
                                                setSelectedWipeId(wipeId);
                                            }}
                                            serverId={selectedServer}
                                            showLifetime={true}
                                            triggerClassName={comboboxTriggerClass}
                                            triggerStyle={inputControlStyle}
                                        />
                                    ) : (
                                        <div
                                            className="flex h-10 w-full items-center rounded-md border px-3 text-sm"
                                            style={{
                                                borderColor: leaderboardTheme.inputBorder,
                                                color: leaderboardTheme.textMutedColor,
                                                borderRadius: leaderboardTheme.inputBorderRadius,
                                            }}
                                        >
                                            Select a server
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            ) : null}

            <Card
                className={cn(
                    "transition-shadow",
                    hideFilterCard ? "border-border bg-transparent shadow-none" : "hover:shadow-md",
                )}
                style={hideFilterCard ? undefined : tableCardStyle}
            >
                <CardContent
                    className={hideFilterCard ? "p-0" : undefined}
                    style={
                        hideFilterCard ? undefined : { padding: leaderboardTheme.cardPadding }
                    }
                >
                    <div
                        className="overflow-hidden rounded-md border"
                        style={{
                            borderColor: tableBorderColor,
                        }}
                    >
                        <Table className="w-full text-sm" style={{ color: leaderboardTheme.tableHeaderText }}>
                            <TableHeader>
                                {table.getHeaderGroups().map((headerGroup) => (
                                    <TableRow
                                        key={headerGroup.id}
                                        className="border-0 hover:bg-transparent"
                                        style={{
                                            backgroundColor: leaderboardTheme.tableHeaderBg,
                                            borderColor: tableBorderColor,
                                        }}
                                    >
                                        {headerGroup.headers.map((header) => (
                                            <TableHead
                                                key={header.id}
                                                className={cn(
                                                    "h-auto min-h-0 py-1.5 text-xs font-medium",
                                                    LEFT_ALIGN_IDS.has(header.column.id)
                                                        ? "pl-2 pr-1 text-left"
                                                        : "px-1 text-center",
                                                )}
                                                style={{
                                                    color: leaderboardTheme.tableHeaderText,
                                                }}
                                            >
                                                {header.isPlaceholder
                                                    ? null
                                                    : flexRender(
                                                          header.column.columnDef.header,
                                                          header.getContext(),
                                                      )}
                                            </TableHead>
                                        ))}
                                    </TableRow>
                                ))}
                            </TableHeader>
                            <TableBody>
                                {table.getRowModel().rows?.length ? (
                                    table.getRowModel().rows.map((row) => {
                                        const globalRank =
                                            (page - 1) * pageSize + row.index + 1;
                                        /* Inset shadow so hover reads over inline row backgroundColor */
                                        const rowHoverInset =
                                            globalRank === 1
                                                ? "hover:shadow-[inset_0_0_0_9999px_rgba(245,158,11,0.14)]"
                                                : globalRank === 2
                                                  ? "hover:shadow-[inset_0_0_0_9999px_rgba(148,163,184,0.11)]"
                                                  : globalRank === 3
                                                    ? "hover:shadow-[inset_0_0_0_9999px_rgba(205,127,50,0.15)]"
                                                    : "hover:shadow-[inset_0_0_0_9999px_rgba(255,255,255,0.04)]";
                                        return (
                                        <TableRow
                                            key={row.id}
                                            data-state={row.getIsSelected() && "selected"}
                                            className={cn(
                                                "group border-0 transition-[box-shadow,color] duration-200",
                                                rowHoverInset,
                                            )}
                                            style={{
                                                borderColor: tableBorderColor,
                                                backgroundColor:
                                                    row.original.steam_id === session?.user?.steamId
                                                        ? leaderboardTheme.tableRowHighlightBg
                                                        : leaderboardTheme.tableRowBg,
                                            }}
                                        >
                                            {row.getVisibleCells().map((cell) => (
                                                <TableCell
                                                    key={cell.id}
                                                    className={cn(
                                                        "py-1.5 align-middle text-xs",
                                                        LEFT_ALIGN_IDS.has(cell.column.id)
                                                            ? "pl-2 pr-1 text-left"
                                                            : "px-1 text-center",
                                                    )}
                                                    style={{
                                                        color: leaderboardTheme.tableRowText,
                                                    }}
                                                >
                                                    {flexRender(
                                                        cell.column.columnDef.cell,
                                                        cell.getContext(),
                                                    )}
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                        );
                                    })
                                ) : (
                                    <TableRow className="border-0">
                                        <TableCell
                                            colSpan={columns.length}
                                            className="h-14 py-4 text-center text-sm"
                                            style={{
                                                color: leaderboardTheme.textMutedColor,
                                            }}
                                        >
                                            {isLoading ? "Loading..." : "No results."}
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                        <div
                            className="flex flex-col gap-3 border-t px-2 py-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
                            style={{
                                borderColor: tableBorderColor,
                                backgroundColor: leaderboardTheme.tableHeaderBg,
                            }}
                        >
                            <p
                                className="text-xs sm:text-sm"
                                style={{ color: leaderboardTheme.textMutedColor }}
                            >
                                Page {page} of {data?.totalPages ?? 1}
                            </p>
                            <div className="flex flex-wrap items-center justify-end gap-1.5 sm:gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    style={secondaryButtonStyle}
                                    className="h-8 w-8 p-0 sm:h-9 sm:w-9"
                                    onClick={() => setPage(1)}
                                    disabled={!table.getCanPreviousPage()}
                                >
                                    <ChevronsLeft className="h-4 w-4" />
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    style={secondaryButtonStyle}
                                    className="h-8 w-8 p-0 sm:h-9 sm:w-9"
                                    onClick={() => setPage(page - 1)}
                                    disabled={!table.getCanPreviousPage()}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                {Array.from({ length: Math.min(5, data?.totalPages ?? 1) }, (_, i) => {
                                    const pageNum = table.getState().pagination.pageIndex - 2 + i
                                    if (pageNum < 0 || pageNum >= (data?.totalPages ?? 1)) return null
                                    const isActivePage =
                                        table.getState().pagination.pageIndex === pageNum
                                    return (
                                        <Button
                                            type="button"
                                            key={pageNum}
                                            variant="outline"
                                            size="sm"
                                            className="h-8 min-w-8 px-2 sm:h-9 sm:min-w-9"
                                            style={
                                                isActivePage ? primaryButtonStyle : secondaryButtonStyle
                                            }
                                            onClick={() => setPage(pageNum + 1)}
                                        >
                                            {pageNum + 1}
                                        </Button>
                                    )
                                })}
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    style={secondaryButtonStyle}
                                    className="h-8 w-8 p-0 sm:h-9 sm:w-9"
                                    onClick={() => setPage(page + 1)}
                                    disabled={!table.getCanNextPage()}
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    style={secondaryButtonStyle}
                                    className="h-8 w-8 p-0 sm:h-9 sm:w-9"
                                    onClick={() => setPage(data?.totalPages ?? 1)}
                                    disabled={!table.getCanNextPage()}
                                >
                                    <ChevronsRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}