import type { Viewport } from "next";
import { Inter } from "next/font/google";
import { headers } from "next/headers";
import Script from "next/script";
import "./globals.css";
import { Providers } from "@/components/providers/providers";
import { backendApi } from "@/lib/api";
import { CookieConsentBanner } from "@/components/cookie-consent-banner";
import { ConditionalAnalytics } from "@/components/conditional-analytics";
import { UserActivityTracker } from "@/components/user-activity-tracker";
import { ClientThemeInjector } from "@/components/theme/client-theme-injector";
import { PageElementApplier } from "@/components/theme/page-element-applier";

const inter = Inter({ subsets: ["latin"] });

const FETCH_TIMEOUT_MS = 5000;

export async function generateMetadata() {
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") ?? "";
  if (pathname.startsWith("/auth")) {
    return {
      title: "Magic Rust Template",
      description: "A powerful Rust server website template",
    };
  }

  let siteMetadata: Record<string, unknown> | null = null;
  try {
    const res = await fetch(backendApi("data?include=siteMetadata"), {
      headers: { Accept: "application/json" },
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    const data = res.ok ? await res.json() : {};
    siteMetadata = (data?.siteMetadata as Record<string, unknown>) ?? null;
  } catch {
    // ignore - use defaults
  }

  return {
    title: siteMetadata?.siteTitle || 'Magic Rust Template',

    description: siteMetadata?.siteDescription || 'A powerful Rust server website template',

    keywords: (typeof siteMetadata?.keywords === 'string' ? siteMetadata.keywords.split(',') : null) || ['rust', 'gaming', 'server'],

    openGraph: {
      title: siteMetadata?.ogTitle || siteMetadata?.siteTitle || 'Magic Rust Template',

      description: siteMetadata?.ogDescription || siteMetadata?.siteDescription || 'A powerful Rust server website template',

      url: siteMetadata?.siteUrl,

      siteName: siteMetadata?.siteName,

      images: siteMetadata?.ogImageUrl ? [
        {
          url: siteMetadata.ogImageUrl,

          width: 1200,

          height: 630,

          alt: siteMetadata?.ogImageAlt || 'Default Open Graph Image',
        },
      ] : [],

      type: 'website',
    },

    twitter: {
      card: 'summary_large_image',

      title: siteMetadata?.twitterTitle || siteMetadata?.siteTitle || 'Magic Rust Template',

      description: siteMetadata?.twitterDescription || siteMetadata?.siteDescription || 'A powerful Rust server website template',

      images: siteMetadata?.twitterImageUrl ? [siteMetadata.twitterImageUrl] : [],
    },
  };
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,

}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const timestamp = Date.now();
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") ?? "";
  const isAuthRoute = pathname.startsWith("/auth");

  let faviconUrl = '/favicon.ico';
  if (!isAuthRoute) {
    try {
      const res = await fetch(backendApi("data?include=themeSettings"), {
        headers: { Accept: "application/json" },
        next: { revalidate: 60 },
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      });
      const data = res.ok ? await res.json() : {};
      const theme = data?.themeSettings as { faviconImage?: string } | undefined;
      if (theme?.faviconImage) faviconUrl = theme.faviconImage;
    } catch {
      // ignore
    }
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href={faviconUrl} />
        <link rel="stylesheet" href={`${backendApi("admin/theme/styles")}?v=${timestamp}`} />
        <link rel="stylesheet" href={`${backendApi("admin/page-elements/styles")}?v=${timestamp}`} />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <ClientThemeInjector />
        <Providers>
          <PageElementApplier />
          {children ?? null}
          <CookieConsentBanner />
          <UserActivityTracker />
          {/* https://images.squarespace-cdn.com/content/v1/627cb6fa4355783e5e375440/f1083091-79f6-4750-b867-e1bc587dfca0/rust_12_minicopter.jpg */}
        </Providers>
        <ConditionalAnalytics />
        {process.env.NEXT_PUBLIC_FIGMA_CAPTURE === "1" ? (
          <Script
            src="https://mcp.figma.com/mcp/html-to-design/capture.js"
            strategy="beforeInteractive"
          />
        ) : null}
      </body>
    </html>
  );
}
