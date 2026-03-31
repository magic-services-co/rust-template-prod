"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { backendApi } from "@/lib/api";
import { getAuthToken } from "@/lib/laravel-auth";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

interface Server {
    server_id: string;
    server_name: string;
    categoryName: string;
}

export function ServerCombobox({
    value,
    onChange,
    disabled = false,
    allowNone = false
}: {
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
    allowNone?: boolean;
}) {
    const [open, setOpen] = useState(false);

    const { data: servers } = useQuery<Server[]>({
        queryKey: ["servers"],
        queryFn: async () => {
            const token = getAuthToken();
            const headers: Record<string, string> = { Accept: 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;
            const response = await fetch(backendApi("servers"), { credentials: 'include', headers });
            if (!response.ok) throw new Error("Failed to fetch servers");
            const responseData = await response.json();
            
            const categories = responseData.data || responseData;
            
            const allServers: Server[] = [];
            if (Array.isArray(categories)) {
                categories.forEach((category: any) => {
                    if (category.servers) {
                        category.servers.forEach((server: any) => {
                            allServers.push({
                                server_id: server.server_id,
                                server_name: server.server_name,
                                categoryName: category.name || "Unknown"
                            });
                        });
                    }
                });
            }
            return allServers;
        }
    });

    const selectedServer = servers?.find(s => s.server_id === value);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between"
                    disabled={disabled}
                >
                    {selectedServer ? selectedServer.server_name : "Select server..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0" align="start">
                <Command>
                    <CommandInput placeholder="Search server..." />
                    <CommandList>
                        <CommandEmpty>No server found.</CommandEmpty>
                        {allowNone && (
                            <CommandGroup>
                                <CommandItem
                                    value="none"
                                    onSelect={() => {
                                        onChange("");
                                        setOpen(false);
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            value === "" ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    None (General Page)
                                </CommandItem>
                            </CommandGroup>
                        )}
                        {servers?.map((server) => (
                            <CommandGroup key={server.server_id} heading={server.categoryName}>
                                <CommandItem
                                    value={server.server_id}
                                    onSelect={() => {
                                        onChange(server.server_id);
                                        setOpen(false);
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            value === server.server_id ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    {server.server_name}
                                </CommandItem>
                            </CommandGroup>
                        ))}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
