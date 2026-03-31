"use client";

import Image from "next/image";

export default function MagicLogo({ className }: { className?: string }) {
    return (
        <Image
            src="/images/logo.svg"
            alt="Magic Logo"
            width={84}
            height={84}
            className={className}
        />
    )
}