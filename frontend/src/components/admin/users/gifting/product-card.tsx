"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Product } from "@/types/store";
import Image from "next/image";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ProductCardProps {
    product: Product;
    isPending: boolean;
    onSelect: (productId: string) => void;
}

export function ProductCard({ product, isPending, onSelect }: ProductCardProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [contentMounted, setContentMounted] = useState(false);

    const handleConfirm = () => {
        setTimeout(() => {
            setIsOpen(false);
            setTimeout(() => {
                setContentMounted(false);
                onSelect(product.id);
            }, 200);
        }, 0);
    };

    const handleOpenChange = (open: boolean) => {
        if (open) {
            setContentMounted(true);
            setIsOpen(true);
        } else {
            setIsOpen(false);
            setTimeout(() => setContentMounted(false), 200);
        }
    };

    return (
        <Card className="p-4 flex items-center justify-between flex-row">
            <CardHeader className="p-0 flex flex-row items-center gap-2">
                {typeof product.image_url === 'string' && product.image_url && (
                    <Image
                        src={product.image_url}
                        alt={typeof product.name === 'string' ? product.name : ''}
                        width={65}
                        height={65}
                    />
                )}
                <div className="flex flex-col gap-1">
                    <CardTitle className="text-sm font-medium">
                        {product.name}
                    </CardTitle>
                    {product.tags && Array.isArray(product.tags) && product.tags.length > 0 && (
                        <p className="text-xs text-muted-foreground">
                            Tag: {product.tags.map((tag) => (tag as { name?: string; slug?: string }).name ?? (tag as { slug?: string }).slug ?? '').filter(Boolean).join(", ")}
                        </p>
                    )}
                </div>
            </CardHeader>
            <CardFooter className="p-0 flex items-center h-full">
                <AlertDialog open={isOpen} onOpenChange={(open) => setTimeout(() => handleOpenChange(open), 0)}>
                    <span
                        className="inline-block"
                        role="button"
                        tabIndex={0}
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setTimeout(() => {
                                setContentMounted(true);
                                setIsOpen(true);
                            }, 0);
                        }}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                setTimeout(() => {
                                    setContentMounted(true);
                                    setIsOpen(true);
                                }, 0);
                            }
                        }}
                    >
                        <Button type="button">Select</Button>
                    </span>
                    {contentMounted && (
                        <AlertDialogContent onCloseAutoFocus={(e) => e.preventDefault()}>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Confirm Selection</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Are you sure you want to select {product.name}?
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleConfirm} disabled={isPending}>
                                    {isPending ? "Confirming..." : "Confirm"}
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    )}
                </AlertDialog>
            </CardFooter>
        </Card>
    );
}