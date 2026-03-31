"use client";

import * as React from "react"
import { Check, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { useWipes } from "@/hooks/use-wipes"
import { formatDistanceToNow } from "date-fns"

interface WipeComboboxProps {
    value?: number | null;
    onChange?: (value: number | null) => void;
    serverId?: string;
    align?: "start" | "center" | "end";
    showLifetime?: boolean;
    triggerClassName?: string;
    triggerStyle?: React.CSSProperties;
    popoverContentClassName?: string;
    popoverContentStyle?: React.CSSProperties;
}

export function WipeCombobox({
    value,
    onChange,
    serverId,
    align = "center",
    showLifetime = true,
    triggerClassName,
    triggerStyle,
    popoverContentClassName,
    popoverContentStyle,
}: WipeComboboxProps) {
    const [open, setOpen] = React.useState(false)
    const { data: wipesData, isLoading } = useWipes(serverId, false);
    const wipes = React.useMemo(() => wipesData?.data || [], [wipesData?.data]);

    const selectedWipe = React.useMemo(() => {
        if (value === null || value === undefined) return null;
        return wipes.find(w => w.id === value) || null;
    }, [value, wipes]);

    const handleSelect = (wipeId: number | null) => {
        setOpen(false);
        onChange?.(wipeId);
    };

    const isLifetime = value === -1;

    const label = React.useMemo(() => {
        if (isLifetime) {
            return "Lifetime Stats";
        }
        if (isLoading) {
            return "Loading...";
        }
        if (wipes.length === 0) {
            return "No wipes available";
        }
        if (!selectedWipe) {
            return "Select wipe...";
        }
        if (selectedWipe.is_active) {
            return `${selectedWipe.name || `Wipe #${selectedWipe.id}`} (Active)`;
        }
        return selectedWipe.name || `Wipe #${selectedWipe.id}`;
    }, [selectedWipe, wipes, isLoading, isLifetime]);

    if (!serverId || serverId === 'global') {
        return null;
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between bg-background/15 border-border/15 placeholder:text-muted-foreground/60"
                    disabled={!isLoading && wipes.length === 0}
                >
                    <span className="truncate">{label}</span>
                    <ChevronRight className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent
                className={cn("w-[400px] p-0 bg-transparent border-border/15", popoverContentClassName)}
                style={popoverContentStyle}
                align={align}
            >
                <Command 
                    className="bg-secondary/15 backdrop-blur border-border/15 text-muted-foreground"
                    filter={(value, search) => {
                        if (!search) return 1;
                        const itemValue = value.toLowerCase();
                        const searchLower = search.toLowerCase();
                        return itemValue.includes(searchLower) ? 1 : 0;
                    }}
                >
                    <CommandInput placeholder="Search wipes..." />
                    <CommandList>
                        <CommandEmpty>
                            {isLoading ? "Loading wipes..." : "No wipes found for this server."}
                        </CommandEmpty>
                        {showLifetime && (
                            <CommandGroup>
                                <CommandItem
                                    value="lifetime-stats"
                                    onSelect={() => handleSelect(-1)}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            isLifetime ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    <div className="flex flex-col">
                                        <span className="font-medium">Lifetime Stats</span>
                                        <span className="text-xs text-muted-foreground">
                                            All wipes combined
                                        </span>
                                    </div>
                                </CommandItem>
                            </CommandGroup>
                        )}
                        {wipes.length > 0 && (
                            <CommandGroup>
                                {wipes.map((wipe) => (
                                <CommandItem
                                    key={wipe.id}
                                    value={`wipe ${wipe.id} ${wipe.name || ''} ${wipe.is_active ? 'active' : 'inactive'}`}
                                    onSelect={() => handleSelect(wipe.id)}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            value === wipe.id ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium">
                                                {wipe.name || `Wipe #${wipe.id}`}
                                            </span>
                                            {wipe.is_active && (
                                                <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded">
                                                    Active
                                                </span>
                                            )}
                                        </div>
                                        <span className="text-xs text-muted-foreground">
                                            {formatDistanceToNow(new Date(wipe.started_at ?? 0), { addSuffix: true })}
                                        </span>
                                    </div>
                                </CommandItem>
                                ))}
                            </CommandGroup>
                        )}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}

