"use client";

import * as React from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useMediaQuery } from "@/hooks/use-media-query"
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
    Drawer,
    DrawerContent,
    DrawerTrigger,
} from "@/components/ui/drawer"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Check, ChevronRight, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { backendApi } from "@/lib/api"
import { getAuthToken } from "@/lib/laravel-auth"

interface Guild {
    id: string;
    name: string;
}

type DiscordComboboxProps = {
    onChange?: (value: string) => void;
    value?: string | null;
    align?: "start" | "center" | "end";
    allowNone?: boolean;
}

export function DiscordCombobox({ onChange, value, align = "center", allowNone = false }: DiscordComboboxProps) {
    const queryClient = useQueryClient();
    const { data: guilds, isLoading, error } = useQuery<Guild[]>({
        queryKey: ['discord-guilds'],
        queryFn: async () => {
            const token = getAuthToken();
            const headers: HeadersInit = { Accept: "application/json" };
            if (token) headers["Authorization"] = `Bearer ${token}`;
            const response = await fetch(backendApi("admin/discord"), { credentials: "include", headers });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || "Failed to fetch Discord guilds");
            }
            return data;
        },
        staleTime: 1000 * 60 * 5,
        gcTime: 1000 * 60 * 10,
    });

    const refreshMutation = useMutation({
        mutationFn: async () => {
            const token = getAuthToken();
            const headers: HeadersInit = { Accept: "application/json" };
            if (token) headers["Authorization"] = `Bearer ${token}`;
            const response = await fetch(backendApi("admin/discord/refresh"), {
                method: "POST",
                credentials: "include",
                headers,
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || "Failed to refresh Discord guilds");
            }
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['discord-guilds'] });
            toast.success('Discord servers refreshed successfully');
        },
        onError: (error) => {
            toast.error(error.message);
        }
    });

    const [open, setOpen] = React.useState(false)
    const isDesktop = useMediaQuery("(min-width: 768px)")
    const [selectedGuild, setSelectedGuild] = React.useState<Guild | null>(null)
    const [searchQuery, setSearchQuery] = React.useState("")

    React.useEffect(() => {
        const guild = guilds?.find(g => g.id === value);
        setSelectedGuild(guild || null);
    }, [value, guilds]);

    const filteredGuilds = React.useMemo(() => {
        if (!guilds) return [];
        return guilds.filter(
            guild => typeof guild?.name === "string" &&
            guild.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [guilds, searchQuery]);

    const handleSelect = (guildId: string, guild?: Guild) => {
        setSelectedGuild(guild || null);
        setOpen(false);
        setSearchQuery("");
        onChange?.(guildId);
    };

    const label = React.useMemo(() => {
        return selectedGuild ? selectedGuild.name : "Select Discord server...";
    }, [selectedGuild]);

    const content = (
        <Command className="bg-secondary/15 backdrop-blur border-border/15 text-muted-foreground">
            <CommandInput
                placeholder="Search Discord server..."
                value={searchQuery}
                onValueChange={setSearchQuery}
            />
            <CommandList>
                <CommandEmpty>No Discord servers found.</CommandEmpty>
                {allowNone ? (
                    <CommandGroup heading="No Server Selection">
                        <CommandItem
                            key="none"
                            value={"none"}
                            onSelect={() => handleSelect("")}
                        >
                            <Check
                                className={cn(
                                    "mr-2 h-4 w-4",
                                    !value || value.length === 0 ? "opacity-100" : "opacity-0"
                                )}
                            />
                            None
                        </CommandItem>
                    </CommandGroup>
                ) : null}
                <CommandGroup heading="Select a server">
                    {filteredGuilds.map((guild, index) => (
                        <CommandItem
                            key={`${guild.id}-${index}`}
                            value={guild.name}
                            onSelect={() => handleSelect(guild.id, guild)}
                        >
                            <Check
                                className={cn(
                                    "mr-2 h-4 w-4",
                                    value === guild.id ? "opacity-100" : "opacity-0"
                                )}
                            />
                            {guild.name}
                        </CommandItem>
                    ))}
                </CommandGroup>
            </CommandList>
        </Command>
    )

    if (isDesktop) {
        return (
            <div className="flex gap-2">
                <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={open}
                            className="w-full justify-between bg-background/15 border-border/15 placeholder:text-muted-foreground/60"
                        >
                            {label}
                            <ChevronRight className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="p-0 bg-transparent border-border/15" align={align}>
                        {content}
                    </PopoverContent>
                </Popover>
                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => refreshMutation.mutate()}
                    disabled={refreshMutation.isPending}
                >
                    <RefreshCw className={cn("h-4 w-4", refreshMutation.isPending && "animate-spin")} />
                </Button>
            </div>
        )
    }

    return (
        <div className="flex gap-2">
            <Drawer open={open} onOpenChange={setOpen}>
                <DrawerTrigger asChild>
                    <Button variant="outline" className="w-[150px] justify-start">
                        {label}
                    </Button>
                </DrawerTrigger>
                <DrawerContent>
                    <div className="mt-4 border-t">
                        {content}
                    </div>
                </DrawerContent>
            </Drawer>
            <Button
                variant="outline"
                size="icon"
                onClick={() => refreshMutation.mutate()}
                disabled={refreshMutation.isPending}
            >
                <RefreshCw className={cn("h-4 w-4", refreshMutation.isPending && "animate-spin")} />
            </Button>
        </div>
    )
}
