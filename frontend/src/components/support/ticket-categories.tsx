"use client";

import { backendApi } from "@/lib/api";
import { cn } from "@/lib/utils";
import { CategoryWithId } from "@/types/tickets";
import { useQuery } from "@tanstack/react-query";
import { ArrowRightIcon, Lock, Loader2 } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { signIn } from "@/lib/laravel-auth-react";
import { useRouter } from "next/navigation";
import { useSupportTheme } from "@/hooks/use-support-theme";

interface TicketCategoriesProps {
    isSignedIn: boolean;
    serverTheme?: any;
}

export default function TicketCategories({ isSignedIn, serverTheme }: TicketCategoriesProps) {
    const { data: clientTheme } = useSupportTheme();
    
    const theme = clientTheme || serverTheme;
    
    const router = useRouter();
    const { data: categories, isLoading, error } = useQuery({
        queryKey: ['ticket-categories'],
        queryFn: async () => {
            const res = await fetch(backendApi('support'), { credentials: 'include' });
            const data = await res.json();
            return Array.isArray(data) ? data : [];
        },
    });

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[300px] py-8">
                <div className="flex items-center justify-center mb-4">
                    <span 
                        className="inline-flex items-center justify-center w-16 h-16 rounded-full transition-colors duration-300"
                        style={{
                            backgroundColor: theme?.categoryCardBackground || "rgba(255, 255, 255, 0.1)"
                        }}
                    >
                        <Loader2 
                            className="w-12 h-12 animate-spin transition-colors duration-300" 
                            style={{
                                color: theme?.loadingSpinnerColor || "#ffffff"
                            }}
                        />
                    </span>
                </div>
                <h2 
                    className="text-xl font-semibold mb-2 transition-colors duration-300"
                    style={{
                        color: theme?.titleColor || "#ffffff"
                    }}
                >
                    Loading Categories
                </h2>
                <p 
                    className="transition-colors duration-300"
                    style={{
                        color: theme?.subtitleColor || "#b0b0b0"
                    }}
                >
                    Please wait while we load the support categories...
                </p>
            </div>
        );
    }
    
    if (error) {
        return (
            <div className="text-center py-8">
                <p 
                    className="transition-colors duration-300"
                    style={{ color: theme?.errorTextColor || "#ef4444" }}
                >
                    Error loading categories: {error.message}
                </p>
            </div>
        );
    }
    
    if (!categories || !Array.isArray(categories) || categories.length === 0) {
        return (
            <div className="text-center py-8">
                <p 
                    className="transition-colors duration-300"
                    style={{ color: theme?.helpTextColor || "#9ca3af" }}
                >
                    No categories found
                </p>
            </div>
        );
    }

    const handleCategoryClick = (category: CategoryWithId) => {
        if (!isSignedIn) {
            signIn("steam");
            return;
        }
        router.push(`/support/${category.slug}`);
    };

    return (
        <div 
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
            style={{ gap: theme?.spacing || '1rem' }}
        >
            {categories.map((category: CategoryWithId) => (
                <div
                    key={category.slug}
                    onClick={() => handleCategoryClick(category)}
                    className="relative group backdrop-blur p-4 flex items-center justify-center overflow-hidden rounded-md cursor-pointer transition-all duration-300 hover:brightness-110"
                    style={{
                        backgroundColor: theme?.categoryCardBackground || "rgba(255, 255, 255, 0.05)",
                        border: `1px solid ${theme?.categoryCardBorder || "rgba(255, 255, 255, 0.1)"}`,
                        borderRadius: theme?.cardBorderRadius || "0.375rem",
                        padding: theme?.cardPadding || "1rem"
                    }}
                >
                    <div className="px-4 w-full flex justify-between items-center">
                        <h3 
                            className="text-xl uppercase font-bold opacity-50 group-hover:opacity-100 duration-300 transition-colors"
                            style={{
                                color: theme?.categoryCardTitleColor || "#ffffff"
                            }}
                        >
                            {category.name}
                        </h3>
                        <div className="flex items-center gap-2">
                            {!isSignedIn && (
                                <Lock 
                                    className="h-4 w-4 transition-colors duration-300" 
                                    style={{ color: theme?.categoryCardLockColor || "#6b7280" }}
                                />
                            )}
                            <ArrowRightIcon
                                className={cn(
                                    "h-6 w-6 group-hover:translate-x-2 opacity-50 group-hover:opacity-100 duration-300 transition-all",
                                    !isSignedIn && "opacity-30"
                                )}
                                style={{
                                    color: theme?.categoryCardIconColor || "#9ca3af"
                                }}
                            />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )
}