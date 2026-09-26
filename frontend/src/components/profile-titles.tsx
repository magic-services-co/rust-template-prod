"use client";

interface ProfileTitlesProps {
    serverTheme?: Record<string, unknown>;
    userName?: string | null;
}

export function ProfileTitles({ userName }: ProfileTitlesProps) {
    return (
        <div className="mx-auto flex max-w-[760px] flex-col items-center text-center">
            <div className="flex items-center justify-center gap-3">
                <span className="h-px w-7" style={{ backgroundColor: "rgba(186,145,66,0.78)" }} />
                <p className="support-hero-kicker font-mono text-[11px] font-medium leading-[11px] tracking-[2.6px]">
                    ACCOUNT / PROFILE
                </p>
                <span className="h-px w-7" style={{ backgroundColor: "rgba(186,145,66,0.78)" }} />
            </div>
            <h1 className="support-hero-title pt-3.5 text-[40px] font-bold leading-[49px] tracking-[-2.25px] sm:text-[50px]">
                {userName ? userName.toUpperCase() : "PROFILE"}
            </h1>
            <p className="support-hero-subtitle max-w-[555px] pt-2.5 text-[14px] leading-[22.4px]">
                Tickets, linked accounts, orders, and bans.
            </p>
        </div>
    );
}
