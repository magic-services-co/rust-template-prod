"use client";

import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface CopyableTextProps {
    text: string;
    className?: string;
}

export function CopyableText({ text, className = "" }: CopyableTextProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    return (
        <span className={`inline-flex items-center gap-2 bg-muted px-2 py-1 rounded font-mono text-sm border cursor-pointer hover:bg-muted/80 transition-colors ${className}`} onClick={handleCopy}>
            <span>{text}</span>
            {copied ? (
                <Check className="h-3 w-3 text-green-500" />
            ) : (
                <Copy className="h-3 w-3 text-muted-foreground" />
            )}
        </span>
    );
}
