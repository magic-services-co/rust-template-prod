import type { HomeTheme } from "@/lib/home-theme-defaults";

type Listener = (theme: HomeTheme | null) => void;

let draft: HomeTheme | null = null;
const listeners = new Set<Listener>();

export function getHomeThemeDraft(): HomeTheme | null {
  return draft;
}

export function setHomeThemeDraft(theme: HomeTheme | null) {
  draft = theme;
  listeners.forEach((listener) => listener(draft));
}

export function subscribeHomeThemeDraft(listener: Listener) {
  listeners.add(listener);
  listener(draft);
  return () => {
    listeners.delete(listener);
  };
}
