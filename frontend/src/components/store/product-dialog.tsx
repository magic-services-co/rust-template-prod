"use client";

import { Product } from "@/types/store";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import GiftButton from "./gift-button";
import { useStoreData } from "@/hooks/store/use-storefront";
import { useCartContext } from "../context/store-context";
import { useCallback, useEffect, useState, ReactNode } from "react";
import { useSiteSettings } from "@/hooks/use-site-settings";
import { splitBrandName, withStoreDefaults } from "@/lib/layout-theme-defaults";
import { HomeCardCorners } from "@/components/home/home-card-corners";

interface ProductDialogProps {
    product: Product;
    trigger?: ReactNode | ((open: boolean) => ReactNode);
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    theme?: any;
}

export function ProductDialog({ product, trigger, isOpen, setIsOpen, theme }: ProductDialogProps) {
    const { data: store } = useStoreData();
    const { data: siteSettings } = useSiteSettings();
    const { selectedPackage, setSelectedPackage } = useCartContext();
    const t = withStoreDefaults(theme);
    const [countdown, setCountdown] = useState<string | null>(null);
    const [brandLeft, brandRight] = splitBrandName(siteSettings?.name);
    const brand = [brandLeft, brandRight].filter(Boolean).join(" ");
    const selected = selectedPackage?.id === product.id;
    const currency = (store?.currency as string | undefined) || "USD";
    const priceCents =
        ((product.pricing as { price_final?: number } | undefined)?.price_final ??
            (product.price as number | undefined) ??
            0);
    const originalCents = (product.pricing as { price_original?: number } | undefined)?.price_original;
    const productImage =
        typeof product.image_url === "string" && product.image_url.trim()
            ? product.image_url
            : "/images/logo.svg";
    const descriptionHtml = typeof product.description === "string" ? product.description.trim() : "";

    useEffect(() => {
        if (!product.enabled_until) {
            setCountdown(null);
            return;
        }
        const interval = setInterval(() => {
            const now = new Date();
            const end = new Date(product.enabled_until!);
            const diff = end.getTime() - now.getTime();
            if (diff <= 0) {
                setCountdown("Product disabled");
                clearInterval(interval);
                return;
            }
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
            const minutes = Math.floor((diff / (1000 * 60)) % 60);
            const seconds = Math.floor((diff / 1000) % 60);
            setCountdown(
                `${days > 0 ? days + "d " : ""}${hours}h ${minutes}m ${seconds}s`
            );
        }, 1000);
        return () => clearInterval(interval);
    }, [product.enabled_until]);

    const handleSelect = useCallback(() => {
        if (selected) {
            setSelectedPackage(null);
            setIsOpen(false);
            return;
        }
        setSelectedPackage({
            id: product.id,
            name: product.name ?? "Package",
            price: priceCents,
            allow_one_time_purchase: !!product.allow_one_time_purchase,
            allow_subscription: !!product.allow_subscription,
            single_game_server_only: !!product.single_game_server_only,
            gameservers: product.gameservers ?? [],
        });
        setIsOpen(false);
    }, [product, priceCents, selected, setSelectedPackage, setIsOpen]);

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            {trigger ? (
                <DialogTrigger asChild>
                    {typeof trigger === "function" ? trigger(isOpen) : trigger}
                </DialogTrigger>
            ) : null}
            <DialogContent
                className="store-dialog flex max-h-[85vh] w-[calc(100%-2rem)] max-w-[760px] flex-col gap-0 overflow-visible border p-0 shadow-[0px_18px_35px_0px_rgba(0,0,0,0.45)] sm:rounded-none"
                style={{
                    backgroundColor: t.sidebarBackground,
                    borderColor: t.sidebarBorder,
                    ["--store-kicker" as string]: t.kickerColor,
                    ["--store-pack-brand" as string]: t.productCardBrandColor,
                    ["--store-pack-name" as string]: t.productCardTitleColor,
                    ["--store-pack-feature" as string]: t.productCardDescriptionColor,
                    ["--store-pack-price" as string]: t.productCardPriceColor,
                    ["--store-pack-currency" as string]: t.productCardOriginalPriceColor,
                    ["--store-pack-meta" as string]: t.productCardMetaColor,
                    ["--store-pack-accent" as string]: t.kickerColor,
                    ["--store-help-cta" as string]: t.buttonPrimaryText,
                    ["--store-dialog-close" as string]: t.sidebarTextColor,
                }}
            >
                <div className="relative flex min-h-0 flex-1 flex-col overflow-visible">
                <div className="flex items-center justify-between px-5 py-3 pr-12">
                    <p className="store-hero-kicker text-[9px] font-bold tracking-[1.62px]">PACKAGE DETAILS</p>
                    {countdown ? (
                        <p className="store-pack-meta text-[9px] tracking-[1.2px]">
                            {countdown === "Product disabled" ? "UNAVAILABLE" : `AVAILABLE FOR ${countdown}`}
                        </p>
                    ) : null}
                </div>
                <div className="grid min-h-0 flex-1 gap-0 overflow-hidden border-t border-[rgba(255,255,255,0.1)] md:grid-cols-[220px_minmax(0,1fr)]">
                    <div className="group/image relative min-h-[220px] overflow-hidden border-b border-[rgba(255,255,255,0.1)] bg-[#070a0e] md:border-b-0 md:border-r">
                        <img
                            src={productImage}
                            alt=""
                            className="absolute inset-0 size-full origin-top object-contain object-top p-5 pt-0 transition-transform duration-500 ease-out group-hover/image:scale-110"
                        />
                    </div>
                    <div className="flex min-h-0 flex-col overflow-y-auto px-5 py-5">
                        <DialogTitle className="space-y-1 text-left">
                            <p className="store-pack-brand text-[10px] tracking-[1.8px]">{brand}</p>
                            <span className="store-pack-name block pt-1 text-[24px] font-extrabold leading-7 tracking-[-1.4px] sm:text-[28px] sm:tracking-[-2px]">
                                {(product.name || "Package").toUpperCase()}
                            </span>
                        </DialogTitle>
                        <DialogDescription className="sr-only">
                            Details for {product.name || "this package"}.
                        </DialogDescription>
                        <p className="pt-3">
                            <span className="store-pack-price text-[18px] font-extrabold leading-7">
                                ${(priceCents / 100).toFixed(2)}
                            </span>
                            <span className="store-pack-currency ml-1.5 text-[10px] font-medium">{currency}</span>
                            {originalCents && originalCents > priceCents ? (
                                <span className="store-pack-currency ml-2 text-[11px] line-through">
                                    ${(originalCents / 100).toFixed(2)}
                                </span>
                            ) : null}
                        </p>
                        <div className="mt-4 h-px w-12" style={{ backgroundColor: t.kickerColor }} />
                        <div
                            className="store-dialog-body min-h-0 flex-1 overflow-y-auto pt-4"
                            dangerouslySetInnerHTML={{
                                __html: descriptionHtml || "<p>No additional details for this package.</p>",
                            }}
                        />
                        <div className="flex flex-col gap-2 pt-5">
                            <button
                                type="button"
                                className="ghost store-pack-select flex h-[41px] w-full items-center justify-center border text-[10px] font-bold tracking-[1.4px]"
                                onClick={handleSelect}
                            >
                                {selected ? "SELECTED" : "SELECT"}
                            </button>
                            {product.is_gifting_disabled !== true ? (
                                <GiftButton product={product} theme={t} />
                            ) : null}
                        </div>
                    </div>
                </div>
                <HomeCardCorners color="var(--store-pack-accent, #ba9142)" show />
                </div>
            </DialogContent>
        </Dialog>
    );
}
