'use client';

import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { backendApi } from '@/lib/api';
import { getAuthToken } from '@/lib/laravel-auth';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { toast } from 'sonner';
import { ColorPicker } from '@/components/admin/theme/color-picker';
import {
  type ElementEdit,
  buildDraftEditsCss,
  findBestSelectableElement,
  generateSelector,
  getComponentType,
  isSelectableElement,
  isTextEditable,
  pathnameToPageSlug,
  rgbToHex,
} from '@/components/theme/theme-editor-dom';

const CHROME_STYLE_ID = 'live-site-editor-chrome';
const DRAFT_STYLE_ID = 'live-site-editor-draft';

function LiveSiteEditorInner() {
  const searchParams = useSearchParams();
  const pathname = usePathname() ?? '/';
  const router = useRouter();
  const active = searchParams.get('theme-editor') === 'true';
  const [allowed, setAllowed] = useState(false);
  const [panelOpen, setPanelOpen] = useState(true);
  const [unsavedEdits, setUnsavedEdits] = useState<Map<string, ElementEdit>>(new Map());
  const [selected, setSelected] = useState<{
    selector: string;
    componentType: string;
    type: 'text' | 'component';
    text: string;
    styles: Record<string, string>;
  } | null>(null);

  const pageSlug = pathnameToPageSlug(pathname);
  const clickListenerRef = useRef<((e: MouseEvent) => void) | null>(null);

  useEffect(() => {
    if (!active || pathname.startsWith('/admin')) return;
    if (typeof window !== 'undefined' && window.self !== window.top) return;

    let cancelled = false;
    (async () => {
      const token = getAuthToken();
      const headers: Record<string, string> = { Accept: 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;
      const r = await fetch(backendApi('admin/theme?mode=visual'), { credentials: 'include', headers });
      if (!cancelled && r.ok) setAllowed(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [active, pathname]);

  const applyDraftCss = useCallback(() => {
    let style = document.getElementById(DRAFT_STYLE_ID) as HTMLStyleElement | null;
    if (!style) {
      style = document.createElement('style');
      style.id = DRAFT_STYLE_ID;
      document.head.appendChild(style);
    }
    style.textContent = buildDraftEditsCss(pageSlug, unsavedEdits);
  }, [pageSlug, unsavedEdits]);

  useEffect(() => {
    if (!allowed || !active) return;
    applyDraftCss();
  }, [allowed, active, applyDraftCss]);

  const exitEditor = useCallback(() => {
    document.getElementById(DRAFT_STYLE_ID)?.remove();
    document.getElementById(CHROME_STYLE_ID)?.remove();
    document.querySelectorAll('.editor-selected, .editor-group-selected').forEach((el) => {
      el.classList.remove('editor-selected', 'editor-group-selected');
    });
    if (clickListenerRef.current) {
      document.removeEventListener('click', clickListenerRef.current, true);
      clickListenerRef.current = null;
    }
    const next = new URLSearchParams(searchParams.toString());
    next.delete('theme-editor');
    const q = next.toString();
    router.replace(q ? `${pathname}?${q}` : pathname);
  }, [pathname, router, searchParams]);

  useEffect(() => {
    if (!allowed || !active || pathname.startsWith('/admin')) return;
    if (typeof window !== 'undefined' && window.self !== window.top) return;

    let chrome = document.getElementById(CHROME_STYLE_ID) as HTMLStyleElement | null;
    if (!chrome) {
      chrome = document.createElement('style');
      chrome.id = CHROME_STYLE_ID;
      chrome.textContent = `
        .editor-selected { outline: 2px solid #3b82f6 !important; outline-offset: 2px !important; }
        .editor-group-selected { outline: 2px solid #10b981 !important; outline-offset: 2px !important; }
      `;
      document.head.appendChild(chrome);
    }

    const onDocClick = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (!t) return;
      if (t.closest('[data-live-site-editor-ui="true"]')) return;

      e.preventDefault();
      e.stopPropagation();

      let target = findBestSelectableElement(t);
      if (target.tagName === 'A' || target.closest('a')) {
        e.preventDefault();
      }
      if (!isSelectableElement(target)) {
        toast.info('This element cannot be selected');
        return;
      }

      document.querySelectorAll('.editor-selected, .editor-group-selected').forEach((el) => {
        el.classList.remove('editor-selected', 'editor-group-selected');
      });

      const canEditText = isTextEditable(target);
      const componentType = getComponentType(target);
      const selector = generateSelector(target, e.shiftKey);

      const isGroup = selector.startsWith('.');
      if (isGroup) {
        document.querySelectorAll(selector).forEach((el) => el.classList.add('editor-group-selected'));
      } else {
        target.classList.add('editor-selected');
      }

      const computed = window.getComputedStyle(target);
      const styles: Record<string, string> = {
        backgroundColor: rgbToHex(computed.backgroundColor || ''),
        color: rgbToHex(computed.color || ''),
        borderColor: rgbToHex(computed.borderColor || ''),
      };

      setSelected({
        selector,
        componentType,
        type: canEditText ? 'text' : 'component',
        text: canEditText ? target.textContent || '' : '',
        styles,
      });
      setPanelOpen(true);
    };

    clickListenerRef.current = onDocClick;
    document.addEventListener('click', onDocClick, true);

    return () => {
      document.removeEventListener('click', onDocClick, true);
      clickListenerRef.current = null;
      document.getElementById(CHROME_STYLE_ID)?.remove();
      document.getElementById(DRAFT_STYLE_ID)?.remove();
      document.querySelectorAll('.editor-selected, .editor-group-selected').forEach((el) => {
        el.classList.remove('editor-selected', 'editor-group-selected');
      });
    };
  }, [allowed, active, pathname]);

  const updateStyle = (prop: string, value: string) => {
    if (!selected) return;
    const key = `${pageSlug}_${selected.selector}`;
    setUnsavedEdits((prev) => {
      const next = new Map(prev);
      const existing = next.get(key);
      const styles = { ...(existing?.styles || {}), [prop]: value };
      const hasText = existing?.content !== undefined && existing?.content !== null;
      const edit: ElementEdit = {
        id: key,
        pageSlug,
        selector: selected.selector,
        editType: hasText || existing?.editType === 'text' ? 'text' : 'style',
        content: existing?.content,
        styles,
      };
      next.set(key, edit);
      return next;
    });
    setSelected((s) => (s ? { ...s, styles: { ...s.styles, [prop]: value } } : null));

    try {
      document.querySelectorAll(selected.selector).forEach((el) => {
        const cssProp = prop.replace(/([A-Z])/g, '-$1').toLowerCase();
        (el as HTMLElement).style.setProperty(cssProp, value, 'important');
      });
    } catch {
      // invalid selector
    }
  };

  const updateText = (text: string) => {
    if (!selected) return;
    const key = `${pageSlug}_${selected.selector}`;
    setSelected((s) => (s ? { ...s, text } : null));
    setUnsavedEdits((prev) => {
      const next = new Map(prev);
      const existing = next.get(key);
      const edit: ElementEdit = {
        id: key,
        pageSlug,
        selector: selected.selector,
        editType: 'text',
        content: text,
        styles: existing?.styles,
      };
      next.set(key, edit);
      return next;
    });
    try {
      document.querySelectorAll(selected.selector).forEach((el) => {
        (el as HTMLElement).textContent = text;
      });
    } catch {
      // ignore
    }
  };

  const handleSave = async () => {
    if (unsavedEdits.size === 0) {
      toast.message('No changes to save');
      return;
    }
    const token = getAuthToken();
    const headers: Record<string, string> = { 'Content-Type': 'application/json', Accept: 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    const edits = Array.from(unsavedEdits.values());
    const results = await Promise.all(
      edits.map((edit) =>
        fetch(backendApi('admin/page-elements'), {
          method: 'POST',
          credentials: 'include',
          headers,
          body: JSON.stringify(edit),
        })
      )
    );
    const failed = results.filter((r) => !r.ok).length;
    if (failed > 0) {
      toast.error(`Failed to save ${failed} edit(s)`);
      return;
    }
    toast.success(`Saved ${edits.length} change(s)`);
    setUnsavedEdits(new Map());
    document.getElementById(DRAFT_STYLE_ID)?.remove();
    router.refresh();
  };

  if (!active || pathname.startsWith('/admin')) return null;
  if (typeof window !== 'undefined' && window.self !== window.top) return null;

  if (!allowed) {
    return (
      <div
        className="fixed bottom-0 left-0 right-0 z-[9998] bg-amber-950 text-amber-100 text-center text-sm py-2 px-4"
        data-live-site-editor-ui="true"
      >
        Sign in as an admin to use site editor mode, or{' '}
        <button type="button" className="underline font-medium" onClick={exitEditor}>
          exit editor mode
        </button>
        .
      </div>
    );
  }

  return (
    <>
      <div
        className="fixed bottom-0 left-0 right-0 z-[9998] border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 shadow-lg"
        data-live-site-editor-ui="true"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 max-w-screen-2xl mx-auto">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-sm font-medium truncate">Site editor</span>
            {unsavedEdits.size > 0 && (
              <span className="text-xs text-amber-600 dark:text-amber-400 whitespace-nowrap">
                {unsavedEdits.size} unsaved
              </span>
            )}
            {selected && (
              <span className="text-xs text-muted-foreground truncate max-w-[40vw]">{selected.selector}</span>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setPanelOpen((o) => !o)}>
              {panelOpen ? 'Hide panel' : 'Show panel'}
            </Button>
            <Button type="button" variant="secondary" size="sm" onClick={handleSave}>
              Save changes
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={exitEditor}>
              Exit editor
            </Button>
          </div>
        </div>
      </div>

      <Sheet open={panelOpen} onOpenChange={setPanelOpen}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-md overflow-y-auto"
          data-live-site-editor-ui="true"
        >
          <SheetHeader>
            <SheetTitle>Selected element</SheetTitle>
          </SheetHeader>
          {!selected ? (
            <p className="text-sm text-muted-foreground mt-4">
              Click any part of the page to select it. Hold Shift while clicking to use a class-based selection when
              available. Theme colors and typography are in Admin → Theme Editor.
            </p>
          ) : (
            <div className="mt-6 space-y-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Type</p>
                <p className="text-sm capitalize">{selected.componentType}</p>
              </div>
              {selected.type === 'text' && (
                <div className="space-y-2">
                  <Label>Text</Label>
                  <Textarea value={selected.text} onChange={(e) => updateText(e.target.value)} rows={4} />
                </div>
              )}
              <div className="space-y-3">
                <Label>Quick styles</Label>
                <ColorPicker label="Text" value={selected.styles.color || '#000000'} onChange={(v) => updateStyle('color', v)} />
                <ColorPicker
                  label="Background"
                  value={selected.styles.backgroundColor || '#000000'}
                  onChange={(v) => updateStyle('backgroundColor', v)}
                />
                <ColorPicker
                  label="Border"
                  value={selected.styles.borderColor || '#000000'}
                  onChange={(v) => updateStyle('borderColor', v)}
                />
              </div>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => {
                  document.querySelectorAll('.editor-selected, .editor-group-selected').forEach((el) => {
                    el.classList.remove('editor-selected', 'editor-group-selected');
                  });
                  setSelected(null);
                }}
              >
                Clear selection
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}

export function LiveSiteEditor() {
  return (
    <Suspense fallback={null}>
      <LiveSiteEditorInner />
    </Suspense>
  );
}
