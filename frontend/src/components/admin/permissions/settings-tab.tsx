"use client";

import { backendApi } from "@/lib/api";
import { getAuthToken } from "@/lib/laravel-auth";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Role } from "@/types/user";
import { Trash } from "lucide-react";
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
} from "@/components/ui/alert-dialog";
import React from "react";
import useServers from "@/hooks/use-servers";
import { ServerCombobox } from "@/components/server-combobox";
import { ColorPicker } from "@/components/ui/color-picker";
import { DiscordCombobox } from "@/components/discord-combobox";
import { DiscordRoleCombobox } from "@/components/discord-role-combobox";
import { TicketCategoryTab } from './ticket-category-tab';
import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, X, ShoppingCart, Loader2, Clock, Verified, Bot, Users } from 'lucide-react';

interface SettingsTabProps {
    role: Role;
}

interface CheckboxSection {
    title: string;
    items: { key: string; label: string; description: string }[];
}

const checkboxSections: CheckboxSection[] = [
    {
        title: "Assign Role To User",
        items: [
            { key: "assignOnVerification", label: "Verification Role", description: "Assign this role when a user links their discord and steam account." },
            { key: "assignOnBoost", label: "Discord Booster Role", description: "Assign this role when a user boosts the discord server." },
            { key: "assignOnGroupJoin", label: "Steam Group Role", description: "Assign this role when a user joins the steam group." },
            { key: "assignOnPurchase", label: "Purchase Role", description: "Assign this role when a user purchases specific products from the store." },
            { key: "assignOnPlaytime", label: "Playtime Role", description: "Assign this role when a user reaches a certain playtime threshold." },
        ],
    },
];

interface Association {
    discordGuildIds?: string[];
    discordRoleIds?: string[];
    serverIds?: string[];
    oxideGroupNames?: string[];
    type?: "discord" | "rust";
}

interface FormValues {
    name?: string | null;
    color?: string | null;
    assignOnVerification: boolean | null;
    assignOnBoost: boolean | null;
    assignOnGroupJoin: boolean | null;
    assignOnPurchase: boolean | null;
    assignOnPlaytime: boolean | null;
    purchaseProductIds: string[] | null;
    playtimeThresholdHours: number | null;
    mapVotingMultiplier: number | null;
    associations: Association[];
}

interface ProductTag {
    id: number;
    slug: string;
    name: string;
    description: string | null;
}

interface Product {
    id: string;
    name: string;
    slug: string;
    tags?: ProductTag[];
}

function expandAssociationsFromRole(role: any): Association[] {
    const discordGuildIds = Array.isArray(role.discordGuildIds) ? role.discordGuildIds : (role.discordGuildIds ? [role.discordGuildIds] : []);
    const discordRoleIds = Array.isArray(role.discordRoleIds) ? role.discordRoleIds : (role.discordRoleIds ? [role.discordRoleIds] : []);
    const serverIds = Array.isArray(role.serverIds) ? role.serverIds : (role.serverIds ? [role.serverIds] : []);
    const oxideGroupNames = Array.isArray(role.oxideGroupNames) ? role.oxideGroupNames : (role.oxideGroupNames ? [role.oxideGroupNames] : []);

    const associations: Association[] = [];
    
    const discordMaxLen = Math.max(discordGuildIds.length, discordRoleIds.length);
    for (let i = 0; i < discordMaxLen; i++) {
        const hasDiscord = discordGuildIds[i] || discordRoleIds[i];
        if (hasDiscord) {
            associations.push({
                discordGuildIds: [discordGuildIds[i] || ""],
                discordRoleIds: [discordRoleIds[i] || ""],
                serverIds: [""],
                oxideGroupNames: [""],
                type: "discord",
            });
        }
    }
    
    const rustMaxLen = Math.max(serverIds.length, oxideGroupNames.length);
    for (let i = 0; i < rustMaxLen; i++) {
        const hasRust = serverIds[i] || oxideGroupNames[i];
        if (hasRust) {
            associations.push({
                discordGuildIds: [""],
                discordRoleIds: [""],
                serverIds: [serverIds[i] || ""],
                oxideGroupNames: [oxideGroupNames[i] || ""],
                type: "rust",
            });
        }
    }
    
    if (associations.length === 0) {
        return [{ discordGuildIds: [""], discordRoleIds: [""], serverIds: [""], oxideGroupNames: [""], type: "discord" }];
    }
    
    return associations;
}

export function SettingsTab({ role }: SettingsTabProps) {
    const queryClient = useQueryClient();
    const [products, setProducts] = useState<Product[]>([]);
    const [loadingProducts, setLoadingProducts] = useState(false);
    const [purchaseProductIds, setPurchaseProductIds] = useState<string[]>(
        (role.purchaseProductIds as string[]) || []
    );

    const { control, handleSubmit, reset, setValue, watch } = useForm<FormValues>({
        defaultValues: {
            name: role.name,
            color: role.color || null,
            assignOnVerification: !!role.assignOnVerification,
            assignOnBoost: !!role.assignOnBoost,
            assignOnGroupJoin: !!role.assignOnGroupJoin,
            assignOnPurchase: !!role.assignOnPurchase,
            assignOnPlaytime: !!role.assignOnPlaytime,
            purchaseProductIds: (role.purchaseProductIds as string[]) || [],
            playtimeThresholdHours: typeof role.playtimeThresholdHours === 'number' ? role.playtimeThresholdHours : null,
            mapVotingMultiplier: typeof role.mapVotingMultiplier === 'number' ? role.mapVotingMultiplier : null,
            associations: expandAssociationsFromRole(role),
        },
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: "associations",
    });

    const { data: servers, ...serversQuery } = useServers();

    useEffect(() => {
        fetchProducts();
    }, []);

    useEffect(() => {
        if (role) {
            const rolePurchaseProductIds = (role.purchaseProductIds as string[]) || [];
            setPurchaseProductIds(rolePurchaseProductIds);
            reset({
                name: role.name,
                color: role.color || null,
                assignOnVerification: !!role.assignOnVerification,
                assignOnBoost: !!role.assignOnBoost,
                assignOnGroupJoin: !!role.assignOnGroupJoin,
                assignOnPurchase: !!role.assignOnPurchase,
                assignOnPlaytime: !!role.assignOnPlaytime,
                purchaseProductIds: rolePurchaseProductIds,
                playtimeThresholdHours: typeof role.playtimeThresholdHours === 'number' ? role.playtimeThresholdHours : null,
                mapVotingMultiplier: typeof role.mapVotingMultiplier === 'number' ? role.mapVotingMultiplier : null,
                associations: expandAssociationsFromRole(role),
            });
        }
    }, [role, reset]);

    const fetchProducts = async () => {
        setLoadingProducts(true);
        try {
            const token = getAuthToken();
            const headers: Record<string, string> = { Accept: 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;
            const response = await fetch(backendApi('admin/store/products'), { credentials: 'include', headers });
            if (response.ok) {
                const productsData = await response.json();
                setProducts(productsData);
            }
        } catch (error) {
            console.error('Error fetching products:', error);
            toast.error('Failed to load products');
        } finally {
            setLoadingProducts(false);
        }
    };

    const addProductToRole = (productId: string) => {
        if (!purchaseProductIds.includes(productId)) {
            const newProductIds = [...purchaseProductIds, productId];
            setPurchaseProductIds(newProductIds);
            setValue('purchaseProductIds', newProductIds);
        }
    };

    const removeProductFromRole = (productId: string) => {
        const newProductIds = purchaseProductIds.filter(id => id !== productId);
        setPurchaseProductIds(newProductIds);
        setValue('purchaseProductIds', newProductIds);
    };

    const updateRoleSettingsMutation = useMutation({
        mutationFn: async (updatedSettings: Partial<Role>) => {
            const token = getAuthToken();
            const headers: Record<string, string> = { 'Content-Type': 'application/json', Accept: 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;
            const response = await fetch(backendApi(`admin/roles/${role.id}`), {
                method: 'PUT',
                credentials: 'include',
                headers,
                body: JSON.stringify(updatedSettings),
            });
            const data = await response.json();
            if (!response.ok) {
                const msg = data.error ?? data.message ?? (data.errors && typeof data.errors === 'object' ? Object.values(data.errors).flat().join(' ') : null) ?? 'Failed to update role settings';
                throw new Error(msg);
            }
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['user-roles'] });
            toast.success("Role settings updated successfully");
        },
        onError: (error) => {
            toast.error(error?.message ?? 'Failed to update role settings');
        },
    });

    const deleteRoleMutation = useMutation({
        mutationFn: async () => {
            const token = getAuthToken();
            const headers: Record<string, string> = { Accept: 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;
            const response = await fetch(backendApi(`admin/roles/${role.id}`), {
                method: 'DELETE',
                credentials: 'include',
                headers,
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Failed to delete role');
            }
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['user-roles'] });
            toast.success("Role deleted successfully");
        },
        onError: (error) => {
            toast.error(`Failed to delete role: ${error.message}`);
        },
    });

    const onSubmit = (data: FormValues) => {
        const discordAssociations = data.associations.filter(a => a.type === "discord" || (!a.type && (a.discordGuildIds?.[0] || a.discordRoleIds?.[0])));
        const rustAssociations = data.associations.filter(a => a.type === "rust" || (!a.type && (a.serverIds?.[0] || a.oxideGroupNames?.[0])));
        
        const discordGuildIds = discordAssociations.map(a => a.discordGuildIds?.[0] || "").filter(Boolean);
        const discordRoleIds = discordAssociations.map(a => a.discordRoleIds?.[0] || "").filter(Boolean);
        const serverIds = rustAssociations.map(a => a.serverIds?.[0] || "").filter(Boolean);
        const oxideGroupNames = rustAssociations.map(a => a.oxideGroupNames?.[0] || "").filter(Boolean);

        const finalPurchaseProductIds = data.assignOnPurchase ? purchaseProductIds : [];
        const finalPlaytimeThreshold = data.assignOnPlaytime ? data.playtimeThresholdHours : null;

        updateRoleSettingsMutation.mutate({
            ...data,
            mapVotingMultiplier: data.mapVotingMultiplier != null && data.mapVotingMultiplier >= 1 ? data.mapVotingMultiplier : 1,
            discordGuildIds,
            discordRoleIds,
            serverIds,
            oxideGroupNames,
            purchaseProductIds: finalPurchaseProductIds,
            assignOnPurchase: data.assignOnPurchase || false,
            assignOnPlaytime: data.assignOnPlaytime || false,
            playtimeThresholdHours: finalPlaytimeThreshold,
        } as any);
    };

    const handleDeleteRole = () => {
        deleteRoleMutation.mutate();
    };

    return (
        <ScrollArea className="h-[calc(100vh-13rem)] mt-4 pr-4">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 px-4">
                {role.canManage === false && (
                    <div className="rounded-md bg-muted/50 border border-border p-3 text-sm text-muted-foreground">
                        You cannot edit this role. You can only manage roles below your highest role; the site owner can manage all roles.
                    </div>
                )}
                <fieldset className="space-y-8" disabled={role.canManage === false}>
                <div className="space-y-4">
                    <div className="flex flex-row gap-4">
                        <div className="flex-grow">
                            <Label htmlFor="name">Role Name</Label>
                                <Controller
                                        name="name"
                                        control={control}
                                        render={({ field }) => <Input {...field} value={field.value ?? ''} />}
                                    />
                        </div>
                        <div className="">
                            <Label htmlFor="color">Role Color</Label>
                            <Controller
                                name="color"
                                control={control}
                                render={({ field }) => (
                                    <ColorPicker
                                        {...field}
                                        value={field.value}
                                        className="max-w-48 w-full"
                                        onChange={(v) => {
                                            field.onChange(v)
                                        }}
                                    />
                                )}
                            />
                        </div>
                    </div>
                    <div className="space-y-4">
                        <Label>Discord/Rust Associations</Label>
                        {fields.map((item: any, idx: number) => {
                            const associationType = item.type || "discord";
                            const isDiscord = associationType === "discord";
                            const isRust = associationType === "rust";
                            
                            return (
                                <div key={item.id} className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end border-b border-border/10 pb-4 mb-4 relative">
                                    {isDiscord && (
                                        <>
                                            <div>
                                                <Label>Discord Server</Label>
                                                <Controller
                                                    name={`associations.${idx}.discordGuildIds.0`}
                                                    control={control}
                                                    render={({ field }) => (
                                                        <DiscordCombobox
                                                            value={field.value}
                                                            onChange={field.onChange}
                                                            align="start"
                                                            allowNone={true}
                                                        />
                                                    )}
                                                />
                                            </div>
                                            <div className="flex items-end gap-2">
                                                <div className="flex-1">
                                                    <Label>Discord Server Role</Label>
                                                    <Controller
                                                        name={`associations.${idx}.discordRoleIds.0`}
                                                        control={control}
                                                        render={({ field }) => (
                                                            <DiscordRoleCombobox
                                                                guildId={watch(`associations.${idx}.discordGuildIds.0`)}
                                                                value={field.value}
                                                                onChange={field.onChange}
                                                                align="start"
                                                                disabled={!watch(`associations.${idx}.discordGuildIds.0`)}
                                                                allowNone={true}
                                                            />
                                                        )}
                                                    />
                                                </div>
                                                <Button
                                                    type="button"
                                                    variant="destructive"
                                                    size="icon"
                                                    onClick={() => remove(idx)}
                                                    title="Remove association"
                                                >
                                                    <Trash size={18} />
                                                </Button>
                                            </div>
                                        </>
                                    )}
                                    {isRust && (
                                        <>
                                            <div>
                                                <Label>Rust Server</Label>
                                                <Controller
                                                    name={`associations.${idx}.serverIds.0`}
                                                    control={control}
                                                    render={({ field }) => (
                                                        <ServerCombobox
                                                            value={field.value}
                                                            onChange={field.onChange}
                                                            allowGlobal={true}
                                                            allowNone={true}
                                                            align="start"
                                                        />
                                                    )}
                                                />
                                            </div>
                                            <div className="relative pr-12">
                                                <Label>Oxide Group Name</Label>
                                                <Controller
                                                    name={`associations.${idx}.oxideGroupNames.0`}
                                                    control={control}
                                                    render={({ field }) => (
                                                        <Input
                                                            {...field}
                                                            value={field.value ?? ''}
                                                            disabled={!watch(`associations.${idx}.serverIds.0`)}
                                                        />
                                                    )}
                                                />
                                                <Button
                                                    type="button"
                                                    variant="destructive"
                                                    size="icon"
                                                    className="absolute top-[60%] -translate-y-1/2 right-0"
                                                    onClick={() => remove(idx)}
                                                    title="Remove association"
                                                >
                                                    <Trash size={18} />
                                                </Button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            );
                        })}
                        <div className="flex gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => append({ discordGuildIds: [""], discordRoleIds: [""], serverIds: [""], oxideGroupNames: [""], type: "discord" })}
                            >
                                + Add Discord Server
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => append({ discordGuildIds: [""], discordRoleIds: [""], serverIds: [""], oxideGroupNames: [""], type: "rust" })}
                            >
                                + Add Rust Server
                            </Button>
                        </div>
                    </div>
                </div>

                {checkboxSections.map((section) => (
                    <div key={section.title} className="space-y-4">
                        <h3 className="text-lg font-semibold">{section.title}</h3>
                        {section.items.map((item) => (
                            <div key={item.key} className="space-y-4">
                                <div className="flex bg-secondary/15 rounded-md p-4 items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label htmlFor={item.key} className="text-base font-semibold flex items-center gap-2">
                                            {item.key === 'assignOnVerification' && <Verified className="h-4 w-4" />}
                                            {item.key === 'assignOnBoost' && <Bot className="h-4 w-4" />}
                                            {item.key === 'assignOnGroupJoin' && <Users className="h-4 w-4" />}
                                            {item.key === 'assignOnPurchase' && <ShoppingCart className="h-4 w-4" />}
                                            {item.key === 'assignOnPlaytime' && <Clock className="h-4 w-4" />}
                                            {item.label}
                                        </Label>
                                        <p className="text-[0.8rem] text-muted-foreground">{item.description}</p>
                                    </div>
                                    <Controller
                                        name={item.key as keyof FormValues}
                                        control={control}
                                        render={({ field }) => (
                                            <Switch
                                                id={item.key}
                                                checked={field.value as boolean}
                                                onCheckedChange={field.onChange}
                                            />
                                        )}
                                    />
                                </div>
                                
                                {item.key === 'assignOnPurchase' && watch('assignOnPurchase') && (
                                    <div className="ml-4 space-y-4 border-l-2 border-primary/20 pl-4">
                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium">Assigned Products</Label>
                                            {purchaseProductIds.length > 0 ? (
                                                <div className="flex flex-wrap gap-2">
                                                    {purchaseProductIds.map((productId) => {
                                                        const product = products.find(p => p.id === productId);
                                                        return (
                                                            <Badge key={productId} variant="outline" className="gap-1">
                                                                {product?.name || productId}
                                                                <button
                                                                    type="button"
                                                                    onClick={() => removeProductFromRole(productId)}
                                                                    className="ml-1 hover:text-red-500"
                                                                >
                                                                    <X className="h-3 w-3" />
                                                                </button>
                                                            </Badge>
                                                        );
                                                    })}
                                                </div>
                                            ) : (
                                                <p className="text-sm text-muted-foreground">No products assigned</p>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="add-product">Add Product</Label>
                                            <Select onValueChange={addProductToRole}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder={loadingProducts ? "Loading products..." : "Select a product to assign"} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {products
                                                        .filter(product => !purchaseProductIds.includes(product.id))
                                                        .map((product) => (
                                                            <SelectItem key={product.id} value={product.id}>
                                                                {product.tags && product.tags.length > 0
                                                                    ? `${product.name} (${product.tags.map(t => t.name).join(", ")})`
                                                                    : product.name}
                                                            </SelectItem>
                                                        ))
                                                    }
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {products.length === 0 && !loadingProducts && (
                                            <div className="bg-muted/50 rounded-md p-4">
                                                <p className="text-sm text-muted-foreground text-center">
                                                    No products found. Make sure your PayNow store is properly configured and has products available.
                                                </p>
                                            </div>
                                        )}

                                        {loadingProducts && (
                                            <div className="flex items-center justify-center p-4">
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                <span className="ml-2 text-sm">Loading products...</span>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {item.key === 'assignOnPlaytime' && watch('assignOnPlaytime') && (
                                    <div className="ml-4 space-y-4 border-l-2 border-primary/20 pl-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="playtimeThresholdHours" className="text-sm font-medium">Playtime Threshold (Hours)</Label>
                                            <Controller
                                                name="playtimeThresholdHours"
                                                control={control}
                                                render={({ field }) => (
                                                    <Input
                                                        type="number"
                                                        min="1"
                                                        placeholder="Enter hours (e.g., 100 for 100 hours)"
                                                        {...field}
                                                        value={field.value ?? ''}
                                                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                                                    />
                                                )}
                                            />
                                            <p className="text-[0.8rem] text-muted-foreground">
                                                Users will receive this role when their total playtime across all servers reaches this threshold.
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ))}

                <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Map Voting</h3>
                    <div className="flex bg-secondary/15 rounded-md p-4 items-center justify-between">
                        <div className="space-y-0.5">
                            <Label htmlFor="mapVotingMultiplier" className="text-base font-semibold">Vote Multiplier</Label>
                            <p className="text-[0.8rem] text-muted-foreground">Number of votes this role counts as in map voting (e.g., 2 for VIP).</p>
                        </div>
                        <Controller
                            name="mapVotingMultiplier"
                            control={control}
                            render={({ field }) => (
                                <Input
                                    type="number"
                                    min="1"
                                    className="w-20"
                                    {...field}
                                    value={field.value ?? 1}
                                    onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                                />
                            )}
                        />
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Ticket Categories</h3>
                    <div className="bg-secondary/15 rounded-md p-4">
                        <TicketCategoryTab role={role} />
                    </div>
                </div>

                <div className="flex justify-between">
                    {role.canManage !== false && (
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button
                                type="button"
                                variant="destructive"
                                className="flex items-center gap-2"
                            >
                                <Trash size={18} />
                                Delete Role
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete the
                                    role.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDeleteRole}>
                                    {deleteRoleMutation.isPending ? 'Deleting...' : 'Delete'}
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                    )}
                    <Button
                        type="submit"
                        disabled={updateRoleSettingsMutation.isPending || role.canManage === false}
                    >
                        {updateRoleSettingsMutation.isPending ? 'Saving...' : 'Save Changes'}
                    </Button>
                </div>
                </fieldset>
            </form>
        </ScrollArea>
    );
}