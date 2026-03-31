"use client";

import { GameServer } from "@/types/store";
import { Server, ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface GameServerSelectorProps {
    servers: GameServer[];
    selectedServerId: string | null;
    onServerSelect: (serverId: string) => void;
    theme?: any;
}

export function GameServerSelector({ 
    servers, 
    selectedServerId, 
    onServerSelect, 
    theme 
}: GameServerSelectorProps) {
    const availableServers = [...servers].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
    const [open, setOpen] = useState(false);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const selectedServer = availableServers.find(s => s.id === selectedServerId);

    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (!buttonRef.current) return;
            if (!buttonRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        if (open) {
            document.addEventListener("mousedown", handleClick);
        } else {
            document.removeEventListener("mousedown", handleClick);
        }
        return () => document.removeEventListener("mousedown", handleClick);
    }, [open]);

    if (availableServers.length === 0) {
        return (
            <div className="text-center py-4">
                <p 
                    className="text-sm opacity-70"
                    style={{ color: theme?.subtitleColor || "#b0b0b0" }}
                >
                    No servers available
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-3 relative">
            <div className="flex items-center gap-2 mb-1">
                <Server 
                    size={16} 
                    style={{ color: theme?.productCardTitleColor || "#ffffff" }}
                />
                <h3 
                    className="text-sm font-semibold uppercase tracking-wide"
                    style={{ color: theme?.productCardTitleColor || "#ffffff" }}
                >
                    Select Server
                </h3>
            </div>
            <div className="relative w-full">
                <button
                    ref={buttonRef}
                    type="button"
                    className="w-full flex items-center justify-between px-4 py-2 rounded-md border text-sm font-medium focus:outline-none transition select-none"
                    style={{
                        color: theme?.productCardTitleColor || "#ffffff",
                        backgroundColor: theme?.productCardBackground || "rgba(255, 255, 255, 0.05)",
                        borderColor: theme?.productCardBorder || "rgba(255, 255, 255, 0.1)",
                        borderRadius: theme?.cardBorderRadius || "0.375rem",
                        boxShadow: theme?.inputBoxShadow || undefined
                    }}
                    onClick={() => setOpen(v => !v)}
                >
                    <span className={selectedServer ? "" : "opacity-60"}>
                        {selectedServer ? selectedServer.name : "Select a server..."}
                    </span>
                    <ChevronDown className="ml-2" style={{ color: theme?.productCardTitleColor || '#ffffff' }} size={18} />
                </button>
                <AnimatePresence>
                    {open && (
                        <motion.ul
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.18 }}
                            className="absolute z-50 left-0 w-full mt-2 rounded-md shadow-lg border overflow-y-auto max-h-60"
                            style={{
                                background: theme?.dropdownBackground || "#181c23",
                                borderColor: theme?.productCardBorder || "rgba(255,255,255,0.1)",
                                borderRadius: theme?.cardBorderRadius || "0.375rem"
                            }}
                        >
                            {availableServers.map(server => (
                                <li
                                    key={server.id}
                                    className="px-4 py-2 cursor-pointer text-sm font-medium transition-colors"
                                    style={{
                                        color: theme?.productCardTitleColor || "#ffffff",
                                        borderRadius: theme?.cardBorderRadius || "0.375rem",
                                        backgroundColor: selectedServerId === server.id 
                                            ? theme?.categoryCardHoverBackground || "rgba(59, 130, 246, 0.2)"
                                            : "transparent"
                                    }}
                                    onMouseEnter={(e) => {
                                        if (selectedServerId !== server.id) {
                                            e.currentTarget.style.backgroundColor = theme?.categoryCardHoverBackground || "rgba(255, 255, 255, 0.1)";
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (selectedServerId !== server.id) {
                                            e.currentTarget.style.backgroundColor = "transparent";
                                        }
                                    }}
                                    onClick={() => {
                                        onServerSelect(server.id);
                                        setOpen(false);
                                    }}
                                >
                                    {server.name}
                                </li>
                            ))}
                        </motion.ul>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
} 