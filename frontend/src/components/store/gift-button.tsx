"use client"

import { useEffect, useState } from "react"
import { useCheckoutMutation } from "@/hooks/store/use-storefront"
import { signIn, useSession } from "@/lib/laravel-auth-react"
import { Product } from "@/types/store"
import { toast } from "sonner"
import { useStoreSettings } from "@/hooks/use-store-settings"
import { openPayNowPopup } from "@/lib/paynow-popup"
import { Loader2 } from "lucide-react"
import { withStoreDefaults } from "@/lib/layout-theme-defaults"

export default function GiftButton({
    product,
    selectedServerId,
    theme,
}: {
    product: Product;
    selectedServerId?: string;
    theme?: any;
}) {
    const t = withStoreDefaults(theme);
    const { data: storeSettings } = useStoreSettings();
    const { data: session, status } = useSession();
    const { data: checkoutData, mutate, isSuccess, isPending } = useCheckoutMutation();
    const [inputValue, setInputValue] = useState("")

    useEffect(() => {
        if (isSuccess && checkoutData?.url) {
            openPayNowPopup(checkoutData.url);
        }
    }, [isSuccess, checkoutData?.url]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (status === "loading") {
            return;
        }

        if (status === "unauthenticated") {
            return signIn("steam")
        }
        if (storeSettings && storeSettings.requireLinkedToPurchase && !session?.user?.discordId) {
            toast.error("Please link your Discord account to purchase this product.");
            return;
        }
        if (!inputValue.trim()) {
            toast.error("Please input a steam id");
            return;
        }

        if (product.single_game_server_only && !selectedServerId) {
            toast.error("Please select a server to continue.");
            return;
        }

        const lineData: Record<string, unknown> = {
            product_id: product.id,
            gift_to: {
                platform: "steam",
                id: inputValue.trim(),
            },
            quantity: 1,
        };

        if (selectedServerId) {
            lineData.selected_gameserver_id = selectedServerId;
        }

        mutate({
            lines: [lineData]
        })
    }

    return (
        <form
            onSubmit={handleSubmit}
            className="border-t border-[rgba(255,255,255,0.1)] pt-4"
            style={{
                ["--store-sidebar-text" as string]: t.sidebarTextColor,
                ["--store-pack-accent" as string]: t.kickerColor,
            }}
        >
            <p className="store-order-meta pb-2 text-[10px] tracking-[1.2px]">GIFT THIS PACKAGE</p>
            <div className="flex gap-2">
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Recipient Steam ID"
                    className="h-[41px] min-w-0 flex-1 border bg-[#070a0e] px-3 text-[11px] outline-none"
                    style={{
                        borderColor: t.inputBorder,
                        color: inputValue ? t.inputText : t.inputPlaceholder,
                    }}
                />
                <button
                    type="submit"
                    className="ghost store-pack-select inline-flex h-[41px] shrink-0 items-center justify-center border px-3 text-[9px] font-bold tracking-[1.08px]"
                    disabled={isPending}
                >
                    {isPending ? <Loader2 className="size-4 animate-spin" /> : "SEND GIFT"}
                </button>
            </div>
        </form>
    )
}
