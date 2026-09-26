"use client";

import { useEffect, useMemo } from "react";
import { useSavedPageTheme } from "@/hooks/use-saved-page-theme";
import {
  LAYOUT_CHROME_DEFAULTS,
  withLayoutChromeDefaults,
  type LayoutChromeTheme,
} from "@/lib/layout-chrome-defaults";
import type { LayoutTheme } from "@/lib/layout-theme-defaults";

const CSS_VARS: Array<[keyof LayoutChromeTheme, string]> = [
  ["navLinkColor", "--nav-link-color"],
  ["navLinkHoverColor", "--nav-link-hover-color"],
  ["navLinkActiveColor", "--nav-link-active-color"],
  ["navUnderlineColor", "--nav-underline-color"],
  ["navScrolledBackground", "--nav-scrolled-bg"],
  ["signInBackground", "--layout-signin-bg"],
  ["signInText", "--layout-signin-text"],
  ["userMenuBackground", "--user-menu-bg"],
  ["userMenuBorder", "--user-menu-border"],
  ["userMenuKickerColor", "--user-menu-kicker"],
  ["userMenuNameColor", "--user-menu-name"],
  ["userMenuDivider", "--user-menu-divider"],
  ["userMenuItemColor", "--user-menu-item"],
  ["userMenuIconColor", "--user-menu-icon"],
  ["userMenuItemHoverBackground", "--user-menu-item-hover-bg"],
  ["userMenuItemHoverColor", "--user-menu-item-hover"],
  ["userMenuSignoutColor", "--user-menu-signout"],
  ["userMenuSignoutHoverBackground", "--user-menu-signout-hover-bg"],
  ["footerBackground", "--footer-bg"],
  ["footerBorder", "--footer-border"],
  ["footerHeadingColor", "--footer-heading-color"],
  ["footerLinkColor", "--footer-link-color"],
  ["footerMutedColor", "--footer-muted-color"],
  ["footerTaglineColor", "--footer-tagline-color"],
];

export function useLayoutChromeTheme(serverTheme?: LayoutTheme): LayoutChromeTheme {
  const { data } = useSavedPageTheme("layout");
  const theme = useMemo(
    () =>
      withLayoutChromeDefaults({
        ...LAYOUT_CHROME_DEFAULTS,
        ...(serverTheme ?? {}),
        ...(data ?? {}),
      }),
    [serverTheme, data],
  );

  useEffect(() => {
    const root = document.documentElement;
    for (const [key, cssVar] of CSS_VARS) {
      root.style.setProperty(cssVar, theme[key]);
    }
    return () => {
      for (const [, cssVar] of CSS_VARS) {
        root.style.removeProperty(cssVar);
      }
    };
  }, [theme]);

  return theme;
}
