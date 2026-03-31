'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { createRoot } from 'react-dom/client';
import * as React from 'react';
import {
  Home, User, Settings, Search, Heart, Star, Bell, Mail, Calendar,
  Clock, Check, X, Plus, Minus, ArrowRight, ArrowLeft,
  ChevronDown, ChevronUp, Menu, MoreVertical, Download, Upload,
  Edit, Trash, Eye, Lock, Unlock, Play, Pause,
  Volume2, VolumeX, Image, File, Folder, Link,
} from 'lucide-react';
import { backendApi } from '@/lib/api';

type PageElementEdit = {
  pageSlug: string;
  selector: string;
  editType: string;
  content?: string | null;
  icon?: string | null;
};

const ICON_MAP: Record<string, React.ComponentType<{ className?: string; width?: number; height?: number }>> = {
  Home, User, Settings, Search, Heart, Star, Bell, Mail, Calendar,
  Clock, Check, X, Plus, Minus, ArrowRight, ArrowLeft,
  ChevronDown, ChevronUp, Menu, MoreVertical, Download, Upload,
  Edit, Trash, Eye, Lock, Unlock, Play, Pause,
  Volume2, VolumeX, Image, File, Folder, Link,
} as Record<string, React.ComponentType<{ className?: string; width?: number; height?: number }>>;

function pathnameToPageSlug(pathname: string): string {
  if (!pathname || pathname === '/') return 'home';
  return pathname.replace(/^\//, '').split('/')[0] ?? 'home';
}

function applyTextEdit(selector: string, content: string, doc: Document): void {
  try {
    doc.querySelectorAll(selector).forEach((el) => {
      (el as HTMLElement).textContent = content ?? '';
    });
  } catch {
    // invalid selector
  }
}

function applyIconEdit(selector: string, iconName: string, doc: Document): void {
  const IconComponent = ICON_MAP[iconName];
  if (!IconComponent) return;
  const temp = doc.createElement('div');
  temp.style.cssText = 'position:absolute;left:-9999px;visibility:hidden;';
  doc.body.appendChild(temp);
  try {
    const root = createRoot(temp);
    root.render(
      React.createElement(IconComponent, {
        className: 'lucide lucide-' + iconName.toLowerCase(),
        width: 24,
        height: 24,
      })
    );
    const svg = temp.querySelector('svg');
    if (svg) {
      doc.querySelectorAll(selector).forEach((target) => {
        const el = target as HTMLElement;
        const existingSvg = el.tagName === 'SVG' ? el : el.querySelector('svg');
        const cloned = svg.cloneNode(true) as SVGElement;
        if (existingSvg && existingSvg.ownerDocument === doc) {
          existingSvg.innerHTML = cloned.innerHTML;
          Array.from(cloned.attributes).forEach((attr) => {
            if (attr.name !== 'class') existingSvg.setAttribute(attr.name, attr.value);
          });
        } else {
          el.innerHTML = '';
          el.appendChild(cloned);
        }
      });
    }
  } finally {
    temp.remove();
  }
}

export function PageElementApplier() {
  const pathname = usePathname();
  const appliedRef = useRef<string | null>(null);

  useEffect(() => {
    const slug = pathnameToPageSlug(pathname ?? '/');
    const key = `${pathname ?? ''}`;
    if (appliedRef.current === key) return;

    const apply = () => {
      fetch(backendApi('page-elements'), { credentials: 'include', headers: { Accept: 'application/json' } })
        .then((r) => (r.ok ? r.json() : []))
        .then((list: PageElementEdit[]) => {
          const doc = typeof document !== 'undefined' ? document : null;
          if (!doc) return;
          const edits = list.filter((e) => e.pageSlug === slug);
          edits.forEach((edit) => {
            if (edit.editType === 'text' && edit.content !== undefined && edit.content !== null) {
              applyTextEdit(edit.selector, edit.content, doc);
            }
            if (edit.editType === 'icon') {
              const name = edit.icon ?? edit.content;
              if (typeof name === 'string' && name) applyIconEdit(edit.selector, name, doc);
            }
          });
          appliedRef.current = key;
        })
        .catch(() => {});
    };

    const t = setTimeout(apply, 150);
    return () => clearTimeout(t);
  }, [pathname]);

  return null;
}
