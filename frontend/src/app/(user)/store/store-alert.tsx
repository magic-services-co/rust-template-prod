"use client";

import { backendApi } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { HomeCardCorners } from "@/components/home/home-card-corners";

function pad(value: number) {
    return String(Math.max(0, value)).padStart(2, "0");
}

function parseEndDate(description?: string): Date | null {
    if (!description) return null;
    const iso = description.match(/\d{4}-\d{2}-\d{2}(?:[T\s]\d{2}:\d{2}(?::\d{2})?)?/);
    if (iso) {
        const date = new Date(iso[0]);
        if (!Number.isNaN(date.getTime())) return date;
    }
    const numeric = Date.parse(description);
    if (!Number.isNaN(numeric)) return new Date(numeric);
    return null;
}

function formatCountdown(end: Date) {
    const diff = end.getTime() - Date.now();
    if (diff <= 0) return "ENDED";
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    return `ENDS IN ${pad(days)}D ${pad(hours)}H ${pad(minutes)}M`;
}

export default function StoreAlert({ theme }: { theme?: any }) {
    const { data, isLoading, isError } = useQuery({
        queryKey: ["storeSale"],
        queryFn: async () => {
            const response = await fetch(backendApi("admin/store-sale"), { credentials: "include" });
            if (!response.ok) {
                throw new Error("Failed to fetch store sale data");
            }
            return response.json();
        },
    });

    if (isLoading || isError || !data || !data.enabled) {
        return null;
    }

    const content = <StoreAlertContent data={data} theme={theme} />;
    return data.url ? <Link href={data.url}>{content}</Link> : content;
}

function StoreAlertContent({ data, theme }: { data: any; theme?: any }) {
    const endDate = useMemo(() => parseEndDate(data?.description), [data?.description]);
    const [countdown, setCountdown] = useState<string | null>(
        endDate ? formatCountdown(endDate) : null
    );

    useEffect(() => {
        if (!endDate) return;
        const tick = () => setCountdown(formatCountdown(endDate));
        tick();
        const interval = setInterval(tick, 1000);
        return () => clearInterval(interval);
    }, [endDate]);

    const meta = countdown || (typeof data?.description === "string" ? data.description : "");

    return (
        <div
            className="relative w-full shrink-0 overflow-visible border px-5 py-4 lg:w-[270px]"
            style={{
                backgroundColor: theme?.saleBackground || "rgba(11,16,24,0.85)",
                borderColor: theme?.saleBorder || "rgba(186,145,66,0.4)",
                ["--store-sale-title" as string]: theme?.saleTitleColor || "#f0c970",
                ["--store-sale-meta" as string]: theme?.saleMetaColor || "#ba9142",
            }}
        >
            <div className="flex items-center justify-between gap-3">
                <p className="store-sale-title text-[14px] font-bold tracking-[0.35px]">
                    {data?.title}
                </p>
                <span className="size-2 shrink-0 rounded-full bg-[#8add71] opacity-50" />
            </div>
            <div className="mt-2 h-px w-full bg-[rgba(186,145,66,0.25)]" />
            {meta ? (
                <p className="store-sale-meta pt-2 text-[9px] tracking-[1.44px]">{meta}</p>
            ) : null}
            <HomeCardCorners color="#ba9142" show />
        </div>
    );
}
