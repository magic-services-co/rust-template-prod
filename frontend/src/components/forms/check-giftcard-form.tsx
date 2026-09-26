"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { checkGiftcard } from "@/app/actions/store-manage";
import { toast } from "sonner";
import { Loader2Icon } from "lucide-react";
import { withStoreDefaults } from "@/lib/layout-theme-defaults";

function dollars(cents: number): string {
    return `$${(cents / 100).toFixed(2)}`;
}

export default function CheckGiftcardForm({ theme }: { theme?: any }) {
    const t = withStoreDefaults(theme);
    const [cardNumber, setCardNumber] = useState<string>("");
    const [showResult, setShowResult] = useState(false);

    const { data, ...query } = useQuery({
        queryKey: ["paynow-giftcard", cardNumber],
        queryFn: () => checkGiftcard(cardNumber),
        enabled: false,
        refetchOnMount: false,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
    });

    async function submit() {
        const code = cardNumber.trim();
        if (code.length <= 3) {
            toast.error("This is an invalid gift card");
            return;
        }
        const result = await query.refetch();
        if (result.error) {
            toast.error(result.error instanceof Error ? result.error.message : "Failed to check gift card");
            setShowResult(false);
            return;
        }
        if (!(result.data?.data?.length ?? 0)) {
            toast.error("This is an invalid gift card");
            setShowResult(false);
            return;
        }
        setShowResult(true);
    }

    const first = showResult && query.isSuccess ? data?.data?.[0] : undefined;
    const checking = query.isFetching || query.isRefetching;

    return (
        <div
            className="flex flex-col gap-3"
            style={{
                ["--store-sidebar-title" as string]: t.sidebarTitleColor,
                ["--store-sidebar-name" as string]: t.sidebarSelectedNameColor,
                ["--store-sidebar-price" as string]: t.sidebarPriceColor,
                ["--store-sidebar-text" as string]: t.sidebarTextColor,
                ["--store-pack-accent" as string]: t.kickerColor,
                ["--store-help-cta" as string]: t.buttonPrimaryText,
            }}
        >
            {first ? (
                <div className="border bg-[#070a0e] p-4" style={{ borderColor: t.sidebarBorder }}>
                    <p className="store-order-kicker text-[9px] font-bold tracking-[1.62px]">CARD BALANCE</p>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-3 pt-3">
                        <div>
                            <p className="store-order-meta text-[9px] tracking-[1.2px]">REMAINING</p>
                            <p className="store-order-price pt-1 text-[16px] font-bold leading-6">
                                {dollars(first.balance ?? 0)}
                            </p>
                        </div>
                        <div>
                            <p className="store-order-meta text-[9px] tracking-[1.2px]">ORIGINAL</p>
                            <p className="store-order-name pt-1 text-[16px] font-bold leading-6">
                                {dollars(first.starting_balance ?? 0)}
                            </p>
                        </div>
                        <div>
                            <p className="store-order-meta text-[9px] tracking-[1.2px]">USED</p>
                            <p className="store-order-name pt-1 text-[13px] font-bold leading-5">
                                {dollars((first.starting_balance ?? 0) - (first.balance ?? 0))}
                            </p>
                        </div>
                        <div>
                            <p className="store-order-meta text-[9px] tracking-[1.2px]">EXPIRES</p>
                            <p className="store-order-name pt-1 text-[13px] font-bold leading-5">
                                {first.expires_at ? new Date(first.expires_at).toLocaleDateString() : "Never"}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        className="ghost store-help-cta mt-4 text-[9px] font-bold tracking-[1.2px]"
                        onClick={() => {
                            setCardNumber("");
                            setShowResult(false);
                        }}
                    >
                        CHECK ANOTHER
                    </button>
                </div>
            ) : (
                <>
                    <p className="store-order-meta text-[11px] leading-5">
                        Enter a card number to view remaining balance.
                    </p>
                    <input
                        placeholder="Card number"
                        value={cardNumber}
                        onChange={(event) => setCardNumber(event.target.value)}
                        onKeyDown={(event) => {
                            if (event.key === "Enter") {
                                event.preventDefault();
                                void submit();
                            }
                        }}
                        className="h-[37px] w-full border bg-[#070a0e] px-3 text-[11px] outline-none"
                        style={{
                            borderColor: t.inputBorder,
                            color: cardNumber ? t.inputText : t.inputPlaceholder,
                        }}
                    />
                    <button
                        type="button"
                        className="ghost store-pack-select flex h-[41px] w-full items-center justify-center border text-[10px] font-bold tracking-[1.4px]"
                        onClick={() => void submit()}
                        disabled={checking}
                    >
                        {checking ? <Loader2Icon className="size-4 animate-spin" /> : "CHECK"}
                    </button>
                </>
            )}
        </div>
    );
}
