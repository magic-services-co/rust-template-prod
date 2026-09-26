"use client";

import { Copy, Check } from "lucide-react";
import { useState, type MouseEvent } from "react";

interface CopyableTextProps {
    text: string;
    className?: string;
}

function copyWithExecCommand(value: string): boolean {
    const ta = document.createElement("textarea");
    ta.value = value;
    ta.setAttribute("readonly", "");
    ta.setAttribute("aria-hidden", "true");
    ta.style.position = "fixed";
    ta.style.top = "0";
    ta.style.left = "0";
    ta.style.width = "1px";
    ta.style.height = "1px";
    ta.style.padding = "0";
    ta.style.border = "none";
    ta.style.outline = "none";
    ta.style.boxShadow = "none";
    ta.style.background = "transparent";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    ta.setSelectionRange(0, ta.value.length);
    let ok = false;
    try {
        ok = document.execCommand("copy");
    } catch {
        ok = false;
    }
    document.body.removeChild(ta);
    return ok;
}

export function CopyableText({ text, className = "" }: CopyableTextProps) {
    const [copied, setCopied] = useState(false);

    const markCopied = () => {
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2000);
    };

    const handleCopy = (e: MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        e.stopPropagation();

        // execCommand must run in the same turn as the click (HTTP is not a secure context).
        if (copyWithExecCommand(text)) {
            markCopied();
            return;
        }

        if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
            void navigator.clipboard.writeText(text).then(markCopied).catch(() => undefined);
        }
    };

    return (
        <button
            type="button"
            data-copy-chip="true"
            className={`cms-copy ghost inline-flex items-center gap-2 border px-2 py-1 font-mono text-sm ${className}`}
            onClick={handleCopy}
            aria-label={copied ? "Copied" : `Copy ${text}`}
        >
            <span>{text}</span>
            {copied ? (
                <Check className="h-3 w-3 text-[#60c781]" />
            ) : (
                <Copy className="h-3 w-3 opacity-70" />
            )}
        </button>
    );
}
