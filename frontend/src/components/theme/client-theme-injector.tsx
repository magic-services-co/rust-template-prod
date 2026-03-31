'use client';

import { useEffect } from 'react';
import { getStoredTheme, themeToCss } from '@/lib/theme-storage';

const STYLE_ID = 'magic-theme-client-override';

export function ClientThemeInjector() {
  useEffect(() => {
    const theme = getStoredTheme();
    if (!theme) return;

    const css = themeToCss(theme);
    let style = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
    if (!style) {
      style = document.createElement('style');
      style.id = STYLE_ID;
      document.head.appendChild(style);
    }
    style.textContent = css;
  }, []);

  return null;
}
