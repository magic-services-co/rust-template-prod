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

interface Role {
    id: string;
    name: string;
}

type DiscordRoleComboboxProps = {
    guildId: string | null | undefined;
    onChange?: (value: string) => void;
    value?: string | null;
    align?: "start" | "center" | "end";
    disabled?: boolean
    allowNone?: boolean;
}

export function DiscordRoleCombobox({ guildId, onChange, value, align = "center", disabled = false, allowNone = false }: DiscordRoleComboboxProps) {
    const queryClient = useQueryClient();
    const { data, isLoading, error } = useQuery<{ guildId: string, roles: Role[] }>({
        queryKey: ['discord-roles', guildId],
        queryFn: async () => {
            if (!guildId) return { guildId: "", roles: [] };
            const token = getAuthToken();
            const headers: HeadersInit = { Accept: "application/json" };
            if (token) headers["Authorization"] = `Bearer ${token}`;
            const response = await fetch(backendApi(`admin/discord/roles?guildId=${encodeURIComponent(guildId)}`), { credentials: "include", headers });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || "Failed to fetch Discord roles");
            }
            return data;
        },
    });

    const refreshMutation = useMutation({
        mutationFn: async () => {
            if (!guildId) return;
            const token = getAuthToken();
            const headers: HeadersInit = { Accept: "application/json" };
            if (token) headers["Authorization"] = `Bearer ${token}`;
            const response = await fetch(backendApi(`admin/discord/roles?guildId=${encodeURIComponent(guildId)}`), {
                method: "POST",
                credentials: "include",
                headers,
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || "Failed to refresh Discord roles");
            }
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['discord-roles', guildId] });
            toast.success('Discord roles refreshed successfully');
        },
        onError: (error) => {
            toast.error(error.message);
        }
    });

    const [open, setOpen] = React.useState(false)
    const isDesktop = useMediaQuery("(min-width: 768px)")
    const [selectedRole, setSelectedRole] = React.useState<Role | null>(null)
    const [searchQuery, setSearchQuery] = React.useState("")

    React.useEffect(() => {
        const role = data?.roles.find(r => r.id === value);
        setSelectedRole(role || null);
    }, [value, data]);

    const filteredRoles = React.useMemo(() => {
        if (!data || !data.roles) return [];
        return data.roles.filter(role =>
            role.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [data, searchQuery]);

    const handleSelect = (roleId: string, role?: Role) => {
        setSelectedRole(role || null);
        setOpen(false);
        setSearchQuery("");
        onChange?.(roleId);
    };

    const label = React.useMemo(() => {
        return selectedRole ? selectedRole.name : "Select Discord role...";
    }, [selectedRole]);

    const content = (
        <Command className="bg-secondary/15 backdrop-blur border-border/15 text-muted-foreground">
            <CommandInput
                placeholder="Search Discord role..."
                value={searchQuery}
                onValueChange={setSearchQuery}
            />
            <CommandList>
                <CommandEmpty>No Discord roles found.</CommandEmpty>
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
                <CommandGroup>
                    {filteredRoles.map((role) => (
                        <CommandItem
                            key={role.id}
                            value={`${role.name} - ${role.id}`}
                            onSelect={() => handleSelect(role.id, role)}
                        >
                            <Check
                                className={cn(
                                    "mr-2 h-4 w-4",
                                    value === role.id ? "opacity-100" : "opacity-0"
                                )}
                            />
                            {role.name}
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
                            disabled={disabled}
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
                    disabled={disabled || !guildId || refreshMutation.isPending}
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
                    <Button
                        variant="outline"
                        className="w-[150px] justify-start"
                        disabled={disabled}>
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
                disabled={disabled || !guildId || refreshMutation.isPending}
            >
                <RefreshCw className={cn("h-4 w-4", refreshMutation.isPending && "animate-spin")} />
            </Button>
        </div>
    )
}
