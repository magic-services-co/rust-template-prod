"use client";

import { JoinCommunity } from "@/components/home/join-community";
import Rules, { type Rule } from "@/components/home/rules";
import Team, { type TeamMember } from "@/components/home/team";
import { DiscordIcon } from "@/components/icons";
import { JoinDiscordBtn } from "@/components/join-discord-btn";
import { StoreButton } from "@/components/store-button";
import { Spotlight } from "@/components/ui/spotlight";
import { ArrowDownIcon } from "lucide-react";
import Link from "next/link";
import { DiscordUserCount } from "@/components/DiscordUserCount";
import HomeServers from "@/components/home/home-servers";

type ThemeLike = Record<string, unknown> | null | undefined;
type SiteSettingsLike = { name?: string } | null | undefined;
type PageSettingsLike = {
  features?: { showJoinCommunity?: boolean; showServerRules?: boolean; showServers?: boolean; showTeam?: boolean };
  featureSettings?: { serverRules?: { rules?: Rule[] }; team?: { members?: TeamMember[] } };
};

export type HomePageClientProps = {
  theme: ThemeLike;
  siteSettings: SiteSettingsLike;
  settings: PageSettingsLike;
  teamMembersWithRoles: TeamMember[];
};

export function HomePageClient({ theme, siteSettings, settings, teamMembersWithRoles }: HomePageClientProps) {
  const showJoinCommunity = settings?.features?.showJoinCommunity ?? true;
  const showServerRules = settings?.features?.showServerRules ?? true;
  const showServers = settings?.features?.showServers ?? true;
  const showTeam = settings?.features?.showTeam ?? false;

  const primaryTitleColor = theme && typeof theme.primaryTitleColor === "string" ? theme.primaryTitleColor : "#f8fafc";
  const secondaryTextColor = theme && typeof theme.secondaryTextColor === "string" ? theme.secondaryTextColor : "#94a3b8";

  return (
    <>
      <Spotlight
        className="hidden md:block -top-40 left-0 md:left-60 md:-top-20"
        fill="white"
      />
      <div className="container pt-44 md:pt-0">
        <div className="relative md:h-screen flex gap-6 flex-col items-center justify-center text-center mt-0 mb-10">
          <div className="">
            <h1
              className="text-4xl font-bold tracking-tight"
              style={{ color: primaryTitleColor }}
            >
              Welcome to {siteSettings?.name || "Magic Rust Template"}
            </h1>
            <p
              className="text-xl mt-4 max-w-2xl"
              style={{ color: secondaryTextColor }}
            >
              Join our thriving community and experience the ultimate survival gameplay on our high-performance Rust servers.
            </p>
          </div>
          <div className="flex flex-col md:flex-row items-center justify-center gap-4">
            <StoreButton variant="secondary" theme={theme ?? undefined} />
            <JoinDiscordBtn id="discord-button-hero" variant="ghost" theme={theme ?? undefined} />
          </div>
          {(showJoinCommunity || showServerRules) && (
            <Link
              href={showJoinCommunity ? "#join-community" : "#server-rules"}
              className="hidden md:block absolute bottom-12 left-1/2 -translate-x-1/2 "
            >
              <ArrowDownIcon className="animate-bounce text-muted-foreground" size={35} />
            </Link>
          )}
        </div>

        {showJoinCommunity && (
          <section id="join-community" className="py-28 flex flex-col justify-center lg:flex-row lg:items-center lg:pb-[148px]">
            <div className="flex flex-col items-center gap-6 pb-12 lg:items-start lg:pb-0">
              <div className="">
                <div className="w-fit rounded-full bg-secondary/45 group">
                  <div className="rounded-full px-3 py-1">
                    <span className="text-sm flex select-none items-center text-muted-foreground">
                      <DiscordIcon className="group-hover:rotate-[360deg] duration-700 h-4 w-4 mr-1 sm:mr-2" />
                      <DiscordUserCount />
                    </span>
                  </div>
                </div>
                <h2 className="mt-2 text-center text-4xl font-bold lg:text-left" style={{ color: primaryTitleColor }}>
                  Join the community
                </h2>
              </div>
              <p
                className="max-w-[55ch] bg-transparent px-8 text-center leading-8 lg:px-0 lg:text-left"
                style={{ color: secondaryTextColor }}
              >
                Discuss server decisions and community topics, get notified on server wipes and contact our support, all on our Discord Server below.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <JoinDiscordBtn id="discord-button-community" />
              </div>
            </div>
            <JoinCommunity />
          </section>
        )}

        {showServers && (
          <section className="py-28 lg:pb-[148px]">
            <div className="flex flex-col items-center gap-6 pb-12">
              <h2 className="text-center text-4xl font-bold" style={{ color: primaryTitleColor }}>
                Our Servers
              </h2>
              <p
                className="max-w-[75ch] bg-transparent px-8 text-center leading-8"
                style={{ color: secondaryTextColor }}
              >
                Join thousands of players on our high-performance Rust servers. Experience the best survival gameplay with active communities and regular wipes.
              </p>
            </div>
            <HomeServers />
          </section>
        )}

        {showServerRules && (
          <section id="server-rules" className="flex flex-col-reverse md:flex-col md:gap-12 justify-center lg:flex-row lg:items-start lg:pb-[148px]">
            <div className="flex-1 pb-0">
              <Rules rules={settings?.featureSettings?.serverRules?.rules} />
            </div>
            <div className="flex flex-col items-center gap-6 pb-12 pt-5 lg:items-start lg:pb-0">
              <h2 className="mt-2 text-center text-4xl font-bold lg:text-left" style={{ color: primaryTitleColor }}>
                Server Rules
              </h2>
              <p
                className="max-w-[55ch] bg-transparent px-8 text-center leading-8 lg:px-0 lg:text-left"
                style={{ color: secondaryTextColor }}
              >
                View the rules of our servers. We take these rules seriously, and they are not subject to any &quot;loop holes&quot;. Our staff members reserve the right to remove your access to our servers.
              </p>
            </div>
          </section>
        )}

        {showTeam && (
          <section id="team" className="py-28 lg:pb-[148px]">
            <div className="flex flex-col items-center gap-6 pb-12">
              <h2 className="text-center text-4xl font-bold" style={{ color: primaryTitleColor }}>
                Our Team
              </h2>
              <p
                className="max-w-[75ch] bg-transparent px-8 text-center leading-8"
                style={{ color: secondaryTextColor }}
              >
                Meet the dedicated team behind our servers. Our staff members work tirelessly to ensure the best experience for our community.
              </p>
            </div>
            <Team members={teamMembersWithRoles} />
          </section>
        )}
      </div>
    </>
  );
}
