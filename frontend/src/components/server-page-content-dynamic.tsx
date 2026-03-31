"use client";

import dynamic from "next/dynamic";

const ClientServerPageContent = dynamic(
  () =>
    import("@/components/server-page-content").then((mod) => ({
      default: mod.ServerPageContent,
    })),
  { ssr: false }
);

export function ClientServerPageContentDynamic({
  content,
}: {
  content: unknown;
}) {
  return <ClientServerPageContent content={content} />;
}
