"use client";

import { useEffect, useState } from "react";
import { subscribePageThemeDraft } from "@/lib/page-theme-draft-store";

export function usePageThemeDraft(slug: string): Record<string, unknown> | null {
  const [draft, setDraft] = useState<Record<string, unknown> | null>(null);
  useEffect(() => subscribePageThemeDraft(slug, setDraft), [slug]);
  return draft;
}
