"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { checkGiftcard } from "@/app/actions/store-manage";
import { toast } from "sonner";
import { Loader2Icon } from "lucide-react";

export default function CheckGiftcardForm({ theme }: { theme?: any }) {
    const [cardNumber, setCardNumber] = useState<string>("");

    const { data, ...query } = useQuery({
        queryKey: ["paynow-giftcard", cardNumber],
        queryFn: () => checkGiftcard(cardNumber),
        enabled: false,
        refetchOnMount: false,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
    })

    function submit() {
        if (cardNumber.length <= 3) {
            toast.error("This is an invalid gift card");
            return;
        }
        query.refetch()
    }

    return (
        <div className="space-y-2.5">
            <style jsx>{`
                .themed-input::placeholder {
                    color: ${theme?.inputPlaceholder || '#9ca3af'} !important;
                }
            `}</style>
            {query.isSuccess && (data?.data?.length ?? 0) > 0 ? (() => {
                const first = data?.data?.[0];
                return first ? (
                <div 
                    className="flex flex-col gap-2 text-sm"
                    style={{ color: theme?.sidebarTextColor || '#b0b0b0' }}
                >
                    <span>Balance: <span style={{ color: theme?.sidebarTitleColor || '#ffffff' }}>{((first.balance ?? 0) / 100).toFixed(2)} <span style={{ color: theme?.sidebarTextColor || '#b0b0b0' }}>of</span> {((first.starting_balance ?? 0) / 100).toFixed(2)}</span></span>
                    <span>Used: <span style={{ color: theme?.sidebarTitleColor || '#ffffff' }}>{(((first.starting_balance ?? 0) - (first.balance ?? 0)) / 100).toFixed(2)}</span></span>
                    <span>Expires: <span style={{ color: theme?.sidebarTitleColor || '#ffffff' }}>{first.expires_at ? new Date(first.expires_at).toDateString() : "Never"}</span></span>
                </div>
                ) : null;
            })() : null}
            <Input
                placeholder="Card Number"
                value={cardNumber}
                onChange={(event) => setCardNumber(event.target.value)}
                className="border-input/30 themed-input"
                style={{
                    backgroundColor: theme?.inputBackground || 'rgba(255, 255, 255, 0.1)',
                    border: `1px solid ${theme?.inputBorder || 'rgba(255, 255, 255, 0.2)'}`,
                    color: theme?.inputText || '#ffffff',
                    borderRadius: theme?.buttonBorderRadius || '0.375rem'
                }}
            />
            <Button
                className="w-full"
                onClick={submit}
                disabled={query.isFetching || query.isRefetching}
                style={{
                    backgroundColor: theme?.buttonPrimaryBackground || '#52525b',
                    color: theme?.buttonPrimaryText || '#ffffff',
                    borderRadius: theme?.buttonBorderRadius || '0.375rem'
                }}
                onMouseEnter={(e) => {
                    if (!e.currentTarget.disabled) {
                        e.currentTarget.style.backgroundColor = theme?.buttonPrimaryHoverBackground || '#71717a';
                    }
                }}
                onMouseLeave={(e) => {
                    if (!e.currentTarget.disabled) {
                        e.currentTarget.style.backgroundColor = theme?.buttonPrimaryBackground || '#52525b';
                    }
                }}
            >
                {query.isFetching || query.isRefetching ? (
                    <Loader2Icon className="animate-spin" />
                ) : "Check"}
            </Button>
        </div>
    )
}