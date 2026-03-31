"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useMutation } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ChevronDown, ChevronUp, Gift } from "lucide-react"
import { useCheckoutMutation } from "@/hooks/store/use-storefront"
import { signIn, useSession } from "@/lib/laravel-auth-react"
import { Product } from "@/types/store"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useStoreSettings } from "@/hooks/use-store-settings"
import { openPayNowPopup } from "@/lib/paynow-popup"

const submitData = async (data: string): Promise<{ message: string }> => {
    await new Promise(resolve => setTimeout(resolve, 1000))
    return { message: `Gift submitted: ${data}` }
}

export default function GiftButton({ product, selectedServerId }: { product: Product; selectedServerId?: string }) {
    const router = useRouter();
    const { data: storeSettings } = useStoreSettings();
    const { data: session, status } = useSession();
    const { data: checkoutData, mutate, isSuccess: isSuccess, isPending } = useCheckoutMutation();
    const [isVisible, setIsVisible] = useState(false)
    const [inputValue, setInputValue] = useState("")

    /*     const mutation = useMutation({
            mutationFn: submitData,
            onSuccess: (data) => {
                console.log(data.message)
            },
        })
     */
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
        if (!inputValue) {
            toast.error("Please input a steam id");
            return;
        }
        
        if (product.single_game_server_only && !selectedServerId) {
            toast.error("Please select a server to continue.");
            return;
        }

        const lineData: any = {
            product_id: product.id,
            gift_to: {
                platform: "steam",
                id: inputValue,
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
        <div className="w-full">
            <Button
                onClick={() => setIsVisible(!isVisible)}
                className="w-full mb-1.5"
                variant="secondary"
            >
                <Gift
                    size={18}
                    className="mr-2"
                />
                {isVisible ? (
                    <>
                        Gift <ChevronUp className="ml-2 h-4 w-4" />
                    </>
                ) : (
                    <>
                        Gift <ChevronDown className="ml-2 h-4 w-4" />
                    </>
                )}
            </Button>

            <div className="overflow-hidden">
                <AnimatePresence initial={false}>
                    {isVisible && (
                        <motion.div
                            initial={{ y: -100, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -100, opacity: 0 }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                        >
                            <form onSubmit={handleSubmit} className="space-y-2 p-2 bg-black/20 rounded-lg">
                                <div className="flex items-center space-x-2">
                                    {/* <Gift className="h-5 w-5 text-primary" /> */}
                                    <Input
                                        type="text"
                                        value={inputValue}
                                        onChange={(e) => setInputValue(e.target.value)}
                                        placeholder="Steam ID"
                                        className="flex-grow border-border/15 bg-black/45"
                                    />
                                </div>
                                <Button type="submit" className="w-full" disabled={isPending}>
                                    {isPending ? "Redirecting..." : "Send Gift"}
                                </Button>
                            </form>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    )
}