"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence, stagger } from "framer-motion";
import { cn } from "@/lib/utils";
import useServerData, { EnhancedServerData } from "@/hooks/use-server-data";
import { Input } from "../ui/input";
import Image from "next/image";

type ServerGridProps = {
    value: any
    onChange: (value: any) => void
}

const staggerVariants = {
    visible: {
        transition: {
            delayChildren: 0.3,
            staggerChildren: 0.15,
        }
    }
};

const itemVariants = {
    hidden: { y: -150, opacity: 0 },
    visible: {
        y: 0,
        opacity: 1,
        transition: {
            type: "spring",
            stiffness: 300,
            damping: 20,
            mass: 0.8,
        }
    },
    exit: {
        scale: 0,
        opacity: 0,
        transition: {
            duration: 0.3,
            ease: "easeInOut"
        }
    }
};

export default function ServerGrid({ value, onChange }: ServerGridProps) {
    const { serverList, isLoading, isError } = useServerData();
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
    const [filterQuery, setFilterQuery] = useState<string>("");

    const serverGrid = useMemo(() => {
        const servers = serverList.map((q) => q.data).filter((s): s is NonNullable<typeof s> => !!s);
        return servers.filter((server) => value === server.id || server?.name?.toLowerCase().includes(filterQuery.toLowerCase()));
    }, [serverList, filterQuery, value])

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="rounded-md h-full min-h-[200px] bg-muted/30 animate-pulse" />
                ))}
            </div>
        );
    }

    if (isError) {
        return (
            <p className="text-sm text-muted-foreground">Failed to load servers. Please try again.</p>
        );
    }

    return (
        <div className="">
            <div className="max-w-sm ml-auto mb-4">
                <Input
                    placeholder="Search servers"
                    value={filterQuery}
                    onChange={(e) => setFilterQuery(e.target.value)}
                />
            </div>
            <AnimatePresence mode="wait">
                <motion.div
                    key={filterQuery}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                    variants={staggerVariants}
                    initial="visible"
                    animate="visible"
                >
                    {serverGrid.map((server, idx) => (
                        <motion.div
                            key={server?.id}
                            variants={itemVariants}
                            layout
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                        >
                            <ServerGridItem
                                server={server}
                                isSelected={value === server.id}
                                onMouseEnter={() => setHoveredIndex(idx)}
                                onMouseLeave={() => setHoveredIndex(null)}
                                isHovered={hoveredIndex === idx}
                                onClick={() => {
                                    if (value === server.id) {
                                        onChange("");
                                        return;
                                    }
                                    onChange(server.id);
                                }}
                            />
                        </motion.div>
                    ))}
                </motion.div>
            </AnimatePresence>
            {serverGrid.length === 0 && (
                <p className="text-sm text-muted-foreground">No servers match your search.</p>
            )}
        </div>
    )
}

function ServerGridItem({
    server,
    isSelected,
    onMouseEnter,
    onMouseLeave,
    isHovered,
    onClick,
}: {
    server: EnhancedServerData;
    isSelected: boolean;
    onMouseEnter: () => void;
    onMouseLeave: () => void;
    isHovered: boolean;
    onClick: () => void;
}) {
    return (
        <motion.div
            className="relative group block p-2 h-full w-full"
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            onClick={onClick}
            variants={itemVariants}
            layout={"size"}
            initial="hidden"
            animate="visible"
            exit="exit"
        >
            <AnimatePresence>
                {isHovered && (
                    <motion.span
                        className="absolute inset-0 h-full w-full bg-secondary/[0.8] block rounded-lg"
                        layoutId="hoverBackground"
                        initial={{ opacity: 0 }}
                        animate={{
                            opacity: 1,
                            transition: { duration: 0.15 },
                        }}
                        exit={{
                            opacity: 0,
                            transition: { duration: 0.15, delay: 0.2 },
                        }}
                    />
                )}
            </AnimatePresence>
            <div className={cn(
                "rounded-md h-full w-full overflow-hidden bg-card/15 border border-transparent",
                "dark:border-secondary/20 group-hover:border-secondary relative z-20",
                { "bg-secondary/50": isSelected }
            )}>
                <div className="relative z-50">
                    <Image
                        src={server.image_path ?? server.attributes?.details?.rust_headerimage ?? ''}
                        alt={server.name ?? ''}
                        width={430}
                        height={240}
                        className="w-full h-full md:h-[240px] md:w-[430px] object-cover"
                    />
                    <div className="p-4 pt-0">
                        <h4 className="text-gray-900 dark:text-gray-100 font-bold tracking-wide mt-4">
                            {server.name}
                        </h4>
                        {/*  <p className="mt-8 text-gray-600 dark:text-gray-400 tracking-wide leading-relaxed text-sm">
                            {server.server_address || server.attributes.address || (server.attributes.ip + server.attributes.port)}
                        </p> */}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
