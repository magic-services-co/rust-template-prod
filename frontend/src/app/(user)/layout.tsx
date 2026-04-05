import { ReactNode } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { backendApi } from "@/lib/api";
import { LicenseRequiredBlock } from "@/components/license-required-block";
import { UserLayoutClient } from "./user-layout-client";

if (typeof UserLayoutClient === "undefined") {
  throw new Error(
    "[user layout] UserLayoutClient is undefined. Check that ./user-layout-client exports UserLayoutClient."
  );
}

type LayoutThemeSettings = {
  navLinkColor?: string;
  navLinkHoverColor?: string;
  navLinkActiveColor?: string;
  logoImage?: string;
  backgroundImage?: string;
  backgroundOpacity?: number;
};

export const metadata = {};

function clientFacingHost(headersList: Headers): string {
  const forwarded = headersList.get("x-forwarded-host");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() ?? "";
  }
  return headersList.get("host") ?? "";
}

export default async function UserLayout({ children }: { children: ReactNode }) {
  const headersList = await headers();
  const forwardedFor = headersList.get("x-forwarded-for") ?? headersList.get("x-real-ip");
  const host = clientFacingHost(headersList);
  const pathname = headersList.get("x-pathname") ?? "";

  if (!pathname.startsWith("/setup")) {
    const setupRes = await fetch(backendApi("setup/status"), {
      headers: {
        Accept: "application/json",
        ...(forwardedFor && { "X-Forwarded-For": forwardedFor }),
        ...(host && { Host: host }),
        ...(host && { "X-Forwarded-Host": host }),
      },
      cache: "no-store",
    });
    if (setupRes.ok) {
      const setupJson = (await setupRes.json()) as { wizardPending?: boolean };
      if (setupJson.wizardPending === true) {
        redirect("/setup");
      }
    }
  }

  const licenseRes = await fetch(backendApi("license/status"), {
    headers: {
      Accept: "application/json",
      ...(forwardedFor && { "X-Forwarded-For": forwardedFor }),
      ...(host && { Host: host }),
      ...(host && { "X-Forwarded-Host": host }),
    },
    cache: "no-store",
  });
  const licenseData = licenseRes.ok ? await licenseRes.json() : { valid: false };

  if (licenseData.valid !== true) {
    return (
      <LicenseRequiredBlock message={licenseData.message} />
    );
  }

  const res = await fetch(backendApi("data?include=navigationItems,themeSettings"), {
    headers: {
      Accept: "application/json",
      ...(forwardedFor && { "X-Forwarded-For": forwardedFor }),
      ...(host && { Host: host }),
    },
    next: { revalidate: 60 },
  });

  if (res.status === 403) {
    let body: { error?: string; message?: string } = {};
    try {
      body = await res.json();
    } catch {
      // ignore
    }
    if (body.error === "license_required") {
      return (
        <LicenseRequiredBlock message={body.message} />
      );
    }
  }

  const data = res.ok ? await res.json() : {};
  const navItems = Array.isArray(data.navigationItems) ? data.navigationItems : [];
  const theme = data.themeSettings as LayoutThemeSettings | undefined;

  const safeChildren = children ?? null;

  return (
    <UserLayoutClient navItems={navItems} theme={theme}>
      {safeChildren}
    </UserLayoutClient>
  );
}
