type Listener = (theme: Record<string, unknown> | null) => void;

const drafts = new Map<string, Record<string, unknown> | null>();
const listeners = new Map<string, Set<Listener>>();

export function getPageThemeDraft(slug: string): Record<string, unknown> | null {
  return drafts.get(slug) ?? null;
}

export function setPageThemeDraft(slug: string, theme: Record<string, unknown> | null) {
  drafts.set(slug, theme);
  listeners.get(slug)?.forEach((listener) => listener(theme));
}

export function subscribePageThemeDraft(slug: string, listener: Listener) {
  const set = listeners.get(slug) ?? new Set<Listener>();
  set.add(listener);
  listeners.set(slug, set);
  listener(drafts.get(slug) ?? null);
  return () => {
    set.delete(listener);
  };
}
