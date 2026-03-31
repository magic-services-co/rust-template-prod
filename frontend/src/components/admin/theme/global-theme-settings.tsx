'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { backendApi } from '@/lib/api';
import { getAuthToken } from '@/lib/laravel-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { Save, RotateCcw, Maximize2 } from 'lucide-react';
import { persistTheme } from '@/lib/theme-storage';
import { ColorPicker } from './color-picker';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

const AVAILABLE_PAGES = [
  { slug: 'home', label: 'Home', path: '/' },
  { slug: 'leaderboard', label: 'Leaderboard', path: '/leaderboard' },
  { slug: 'servers', label: 'Servers', path: '/servers' },
  { slug: 'maps', label: 'Maps', path: '/maps' },
  { slug: 'bans', label: 'Bans', path: '/bans' },
  { slug: 'store', label: 'Store', path: '/store' },
  { slug: 'support', label: 'Support', path: '/support' },
  { slug: 'profile', label: 'Profile', path: '/profile' },
  { slug: 'link', label: 'Link', path: '/link' },
  { slug: '404', label: '404', path: '/404' },
  { slug: '403', label: '403', path: '/403' },
  { slug: 'privacy-policy', label: 'Privacy Policy', path: '/privacy-policy' },
  { slug: 'terms-of-service', label: 'Terms of Service', path: '/terms-of-service' },
];

const DEFAULT_SETTINGS = {
  primaryTitleColor: '#f8fafc',
  secondaryTextColor: '#8e9db1',
  linkAccentColor: '#4893fe',
  navLinkColor: '#a0abbe',
  navLinkHoverColor: '#f2f4f6',
  navLinkActiveColor: '#f2f4f6',
  primaryButtonBg: '#1e293b',
  primaryButtonHover: '#1e293b',
  primaryButtonText: '#ffffff',
  secondaryButtonBg: '#64748b',
  secondaryButtonHover: '#64748b',
  secondaryButtonText: '#ffffff',
  cardBgDefault: '#ffffff',
  cardBgHover: '#f3f4f6',
  inputBorderColor: '#e5e7eb',
  mutedTextColor: '#6b7280',
  fontFamily: 'Inter',
  borderRadius: '0.5rem',
  spacing: '1rem',
  backgroundOpacity: 10,
  backgroundImage: '/images/background.jpg',
  logoImage: '/images/logo.png',
  faviconImage: '/favicon.ico',
};

interface ThemeSettings {
  enabled?: boolean;
  primaryTitleColor: string;
  secondaryTextColor: string;
  linkAccentColor: string;
  navLinkColor: string;
  navLinkHoverColor: string;
  navLinkActiveColor: string;
  primaryButtonBg: string;
  primaryButtonHover: string;
  primaryButtonText: string;
  secondaryButtonBg: string;
  secondaryButtonHover: string;
  secondaryButtonText: string;
  cardBgDefault: string;
  cardBgHover: string;
  inputBorderColor: string;
  mutedTextColor: string;
  fontFamily: string;
  borderRadius: string;
  spacing: string;
  backgroundOpacity: number;
  backgroundImage: string;
  logoImage: string;
  faviconImage: string;
}

export function GlobalThemeSettings({ hideControls = false }: { hideControls?: boolean }) {
  const [allPages, setAllPages] = useState(AVAILABLE_PAGES);
  const [selectedPage, setSelectedPage] = useState(AVAILABLE_PAGES[0]);
  const [settings, setSettings] = useState<ThemeSettings>({
    enabled: false,
    ...DEFAULT_SETTINGS,
  });
  const [savedSettings, setSavedSettings] = useState<ThemeSettings>({
    enabled: false,
    ...DEFAULT_SETTINGS,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const applyThemeToIframe = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe?.contentDocument) return;

    let style = iframe.contentDocument.getElementById('theme-override') as HTMLStyleElement;
    if (!style) {
      style = iframe.contentDocument.createElement('style');
      style.id = 'theme-override';
      iframe.contentDocument.head.appendChild(style);
    }

    style.textContent = `
      * {
        font-family: ${settings.fontFamily} !important;
      }

      h1, h2, h3, h4, h5, h6 {
        color: ${settings.primaryTitleColor} !important;
      }

      p, span:not(button span), div:not(button div):not(a div) {
        color: ${settings.secondaryTextColor} !important;
      }

      a:not(nav a) {
        color: ${settings.linkAccentColor} !important;
      }

      nav a {
        color: ${settings.navLinkColor} !important;
      }

      nav a:hover {
        color: ${settings.navLinkHoverColor} !important;
      }

      nav a.active, nav a[aria-current] {
        color: ${settings.navLinkActiveColor} !important;
      }

      button:not([class*="secondary"]):not([class*="outline"]):not([class*="ghost"]):not([class*="destructive"]):not([class*="link"]),
      .bg-primary {
        background-color: ${settings.primaryButtonBg} !important;
        color: ${settings.primaryButtonText} !important;
      }

      button:not([class*="secondary"]):not([class*="outline"]):not([class*="ghost"]):not([class*="destructive"]):not([class*="link"]):hover,
      .bg-primary:hover {
        background-color: ${settings.primaryButtonHover} !important;
      }

      button[class*="secondary"],
      .bg-secondary {
        background-color: ${settings.secondaryButtonBg} !important;
        color: ${settings.secondaryButtonText} !important;
      }

      button[class*="secondary"]:hover,
      .bg-secondary:hover {
        background-color: ${settings.secondaryButtonHover} !important;
      }

      .card, [class*="card"] {
        background-color: ${settings.cardBgDefault} !important;
      }

      .card:hover, [class*="card"]:hover {
        background-color: ${settings.cardBgHover} !important;
      }

      input, textarea, select {
        border-color: ${settings.inputBorderColor} !important;
      }

      .text-muted, .text-muted-foreground, [class*="muted"] {
        color: ${settings.mutedTextColor} !important;
      }
    `;
  }, [settings]);

  useEffect(() => {
    const fetchCustomPages = async () => {
      try {
        const token = getAuthToken();
        const headers: Record<string, string> = { Accept: 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const response = await fetch(backendApi('admin/server-pages'), { credentials: 'include', headers });
        if (response.ok) {
          const pages = await response.json();
          const customPages = pages
            .filter((page: any) => page.enabled && !page.server_id)
            .map((page: any) => ({
              slug: page.slug,
              label: page.title,
              path: `/${page.slug}`,
            }));
          
          setAllPages([...AVAILABLE_PAGES, ...customPages]);
        }
      } catch (error) {
        console.error('Error fetching custom pages:', error);
      }
    };

    fetchCustomPages();
  }, []);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    if (iframe.contentDocument?.readyState === 'complete') {
      applyThemeToIframe();
    } else {
      const handleLoad = () => applyThemeToIframe();
      iframe.addEventListener('load', handleLoad);
      return () => iframe.removeEventListener('load', handleLoad);
    }
  }, [applyThemeToIframe]);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const token = getAuthToken();
        const headers: Record<string, string> = { Accept: 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const response = await fetch(backendApi('admin/theme?mode=global'), { credentials: 'include', headers });
        if (!response.ok) {
          throw new Error('Failed to fetch theme settings');
        }
        const data = await response.json();
        setSettings(data);
        setSavedSettings(data);
      } catch (error) {
        console.error('Error fetching theme settings:', error);
        toast.error('Failed to load theme settings');
      }
    };

    fetchSettings();
  }, []);

  const handleToggle = async (enabled: boolean) => {
    try {
      setIsToggling(true);
      const token = getAuthToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json', Accept: 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const response = await fetch(backendApi('admin/theme?action=toggle'), {
        method: 'POST',
        credentials: 'include',
        headers,
        body: JSON.stringify({ mode: 'global', enabled }),
      });

      if (!response.ok) throw new Error('Failed to toggle theme');

      const updated = await response.json();
      setSettings(prev => ({ ...prev, enabled }));
      if (enabled) persistTheme(updated);
      toast.success(enabled ? 'Global theme enabled' : 'Global theme disabled');
    } catch (error) {
      toast.error('Failed to toggle theme');
      console.error('Error toggling theme:', error);
    } finally {
      setIsToggling(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const token = getAuthToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json', Accept: 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const response = await fetch(backendApi('admin/theme?mode=global'), {
        method: 'POST',
        credentials: 'include',
        headers,
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        throw new Error('Failed to save theme settings');
      }

      const saved = await response.json();
      setSavedSettings(settings);
      persistTheme(saved);
      toast.success('Theme settings saved successfully');
    } catch (error) {
      toast.error('Failed to save theme settings');
      console.error('Error saving theme settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetToSaved = () => {
    setSettings(savedSettings);
    toast.success('Reset to saved settings');
    if (iframeRef.current) {
      iframeRef.current.src = iframeRef.current.src;
    }
  };

  const handleResetToDefault = async () => {
    try {
      setIsSaving(true);
      const token = getAuthToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json', Accept: 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const resetResponse = await fetch(backendApi('admin/theme?mode=global'), {
        method: 'POST',
        credentials: 'include',
        headers,
        body: JSON.stringify({ ...DEFAULT_SETTINGS, enabled: settings.enabled }),
      });

      if (!resetResponse.ok) throw new Error('Failed to reset theme');

      const updated = await resetResponse.json();
      const newSettings = { ...DEFAULT_SETTINGS, enabled: settings.enabled };
      setSettings(newSettings);
      setSavedSettings(newSettings);
      persistTheme(updated);

      toast.success('Theme reset to default settings');

      if (iframeRef.current) {
        iframeRef.current.src = iframeRef.current.src;
      }
    } catch (error) {
      toast.error('Failed to reset theme');
      console.error('Error resetting theme:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-200px)] gap-4">
      {!hideControls && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-semibold">Basic Editor</h2>
            <div className="flex items-center gap-2">
              <Switch
                checked={settings.enabled || false}
                onCheckedChange={handleToggle}
                disabled={isToggling}
              />
              <Label className="text-sm">{settings.enabled ? 'Enabled' : 'Disabled'}</Label>
            </div>
          </div>
          <Button onClick={handleSave} disabled={isSaving || !settings.enabled}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      )}
      {hideControls && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Label className="text-sm whitespace-nowrap">Select Page:</Label>
            <Select value={selectedPage.slug} onValueChange={(value) => {
              const page = allPages.find(p => p.slug === value);
              if (page) setSelectedPage(page);
            }}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select a page" />
              </SelectTrigger>
              <SelectContent>
                {allPages.map(page => (
                  <SelectItem key={page.slug} value={page.slug}>
                    {page.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleResetToSaved}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset to Saved
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset to Default
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Reset to Default Theme?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently reset all theme settings to their default values.
                    This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleResetToDefault} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Reset Everything
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button onClick={handleSave} size="sm" disabled={isSaving}>
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      )}

      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="absolute top-4 right-4 z-10">
            <Maximize2 className="w-4 h-4 mr-2" />
            Fullscreen Preview
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-[98vw] h-[98vh] p-0">
          <div className="h-full flex">
            <div className="flex-1 border-r overflow-hidden flex flex-col">
              <div className="bg-muted p-3 border-b">
                <div className="text-sm font-medium">Preview: {selectedPage.label}</div>
              </div>
              <div className="flex-1 overflow-hidden">
                <iframe
                  src={`${selectedPage.path}?theme-preview=true`}
                  className="w-full h-full border-0"
                  sandbox="allow-same-origin allow-scripts"
                />
              </div>
            </div>

            <div className="w-[400px] bg-background flex flex-col max-h-full">
              <div className="p-4 border-b flex-shrink-0">
                <h3 className="font-semibold">Theme Properties</h3>
              </div>

              <div className="flex-1 overflow-auto p-4">
                <div className="space-y-4">
                  <ColorPicker
                    label="Primary Title Color"
                    value={settings.primaryTitleColor}
                    onChange={(value) => setSettings({ ...settings, primaryTitleColor: value })}
                  />

                  <ColorPicker
                    label="Secondary/Body Text Color"
                    value={settings.secondaryTextColor}
                    onChange={(value) => setSettings({ ...settings, secondaryTextColor: value })}
                  />

                  <ColorPicker
                    label="Link/Accent Color"
                    value={settings.linkAccentColor}
                    onChange={(value) => setSettings({ ...settings, linkAccentColor: value })}
                  />

                  <ColorPicker
                    label="Nav Link Color"
                    value={settings.navLinkColor}
                    onChange={(value) => setSettings({ ...settings, navLinkColor: value })}
                  />

                  <ColorPicker
                    label="Nav Link Hover Color"
                    value={settings.navLinkHoverColor}
                    onChange={(value) => setSettings({ ...settings, navLinkHoverColor: value })}
                  />

                  <ColorPicker
                    label="Nav Link (Active) Color"
                    value={settings.navLinkActiveColor}
                    onChange={(value) => setSettings({ ...settings, navLinkActiveColor: value })}
                  />

                  <ColorPicker
                    label="Primary Button Background"
                    value={settings.primaryButtonBg}
                    onChange={(value) => setSettings({ ...settings, primaryButtonBg: value })}
                  />

                  <ColorPicker
                    label="Primary Button Hover"
                    value={settings.primaryButtonHover}
                    onChange={(value) => setSettings({ ...settings, primaryButtonHover: value })}
                  />

                  <ColorPicker
                    label="Primary Button Text Color"
                    value={settings.primaryButtonText}
                    onChange={(value) => setSettings({ ...settings, primaryButtonText: value })}
                  />

                  <ColorPicker
                    label="Secondary Button Background"
                    value={settings.secondaryButtonBg}
                    onChange={(value) => setSettings({ ...settings, secondaryButtonBg: value })}
                  />

                  <ColorPicker
                    label="Secondary Button Hover"
                    value={settings.secondaryButtonHover}
                    onChange={(value) => setSettings({ ...settings, secondaryButtonHover: value })}
                  />

                  <ColorPicker
                    label="Secondary Button Text Color"
                    value={settings.secondaryButtonText}
                    onChange={(value) => setSettings({ ...settings, secondaryButtonText: value })}
                  />

                  <ColorPicker
                    label="Card/Row Background (Default)"
                    value={settings.cardBgDefault}
                    onChange={(value) => setSettings({ ...settings, cardBgDefault: value })}
                  />

                  <ColorPicker
                    label="Card/Row Background (Hover/Active)"
                    value={settings.cardBgHover}
                    onChange={(value) => setSettings({ ...settings, cardBgHover: value })}
                  />

                  <ColorPicker
                    label="Input Border/Field Color"
                    value={settings.inputBorderColor}
                    onChange={(value) => setSettings({ ...settings, inputBorderColor: value })}
                  />

                  <ColorPicker
                    label="Muted Text Color"
                    value={settings.mutedTextColor}
                    onChange={(value) => setSettings({ ...settings, mutedTextColor: value })}
                  />

                  <div className="space-y-2">
                    <Label htmlFor="fontFamily" className="text-xs">Font Family</Label>
                    <Input
                      id="fontFamily"
                      value={settings.fontFamily}
                      onChange={(e) => setSettings({ ...settings, fontFamily: e.target.value })}
                      placeholder="Enter font family"
                      className="text-xs"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="borderRadius" className="text-xs">Border Radius</Label>
                    <Input
                      id="borderRadius"
                      value={settings.borderRadius}
                      onChange={(e) => setSettings({ ...settings, borderRadius: e.target.value })}
                      placeholder="e.g., 0.5rem"
                      className="text-xs"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="spacing" className="text-xs">Base Spacing</Label>
                    <Input
                      id="spacing"
                      value={settings.spacing}
                      onChange={(e) => setSettings({ ...settings, spacing: e.target.value })}
                      placeholder="e.g., 1rem"
                      className="text-xs"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="backgroundOpacity" className="text-xs">Background Opacity</Label>
                    <div className="flex items-center gap-4">
                      <input
                        id="backgroundOpacity"
                        type="range"
                        min={1}
                        max={100}
                        step={1}
                        value={settings.backgroundOpacity}
                        onChange={e => setSettings({ ...settings, backgroundOpacity: parseInt(e.target.value) })}
                        className="w-full h-2 rounded-lg appearance-none bg-secondary/40 focus:outline-none focus:ring-2 focus:ring-accent/60 shadow-sm transition-all duration-200
                          [&::-webkit-slider-thumb]:appearance-none
                          [&::-webkit-slider-thumb]:w-5
                          [&::-webkit-slider-thumb]:h-5
                          [&::-webkit-slider-thumb]:rounded-full
                          [&::-webkit-slider-thumb]:bg-accent
                          [&::-webkit-slider-thumb]:border-2
                          [&::-webkit-slider-thumb]:border-accent-foreground
                          [&::-webkit-slider-thumb]:shadow-md
                          [&::-webkit-slider-thumb]:transition-all
                          [&::-webkit-slider-thumb]:duration-200
                          [&::-moz-range-thumb]:appearance-none
                          [&::-moz-range-thumb]:w-5
                          [&::-moz-range-thumb]:h-5
                          [&::-moz-range-thumb]:rounded-full
                          [&::-moz-range-thumb]:bg-accent
                          [&::-moz-range-thumb]:border-2
                          [&::-moz-range-thumb]:border-accent-foreground
                          [&::-moz-range-thumb]:shadow-md
                          [&::-moz-range-thumb]:transition-all
                          [&::-moz-range-thumb]:duration-200
                          "
                      />
                      <span className="w-12 text-right text-xs">{settings.backgroundOpacity}%</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="backgroundImage" className="text-xs">Background Image URL</Label>
                    <Input
                      id="backgroundImage"
                      value={settings.backgroundImage}
                      onChange={e => setSettings({ ...settings, backgroundImage: e.target.value })}
                      placeholder="/images/background.jpg"
                      className="text-xs"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="logoImage" className="text-xs">Logo Image URL</Label>
                    <Input
                      id="logoImage"
                      value={settings.logoImage}
                      onChange={e => setSettings({ ...settings, logoImage: e.target.value })}
                      placeholder="/images/logo.png"
                      className="text-xs"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="faviconImage" className="text-xs">Favicon URL</Label>
                    <Input
                      id="faviconImage"
                      value={settings.faviconImage}
                      onChange={e => setSettings({ ...settings, faviconImage: e.target.value })}
                      placeholder="/favicon.ico"
                      className="text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-[1fr_400px] gap-4 flex-1 min-h-0">
        <div className="border rounded-lg overflow-hidden bg-background min-h-0">
          <div className="bg-muted p-2 flex items-center justify-between border-b">
            <div className="text-sm text-muted-foreground">Preview: {selectedPage.label}</div>
          </div>
          <iframe
            ref={iframeRef}
            src={`${selectedPage.path}?theme-preview=true`}
            className="w-full h-[calc(100%-41px)]"
            sandbox="allow-same-origin allow-scripts"
          />
        </div>

        <div className="border rounded-lg bg-background flex flex-col min-h-0 max-h-full">
          <div className="p-4 border-b flex-shrink-0">
            <h3 className="font-semibold">Theme Properties</h3>
          </div>

          <div className="flex-1 overflow-auto p-4">
            <div className="space-y-4">
              <ColorPicker
                label="Primary Title Color"
                value={settings.primaryTitleColor}
                onChange={(value) => setSettings({ ...settings, primaryTitleColor: value })}
              />

              <ColorPicker
                label="Secondary/Body Text Color"
                value={settings.secondaryTextColor}
                onChange={(value) => setSettings({ ...settings, secondaryTextColor: value })}
              />

              <ColorPicker
                label="Link/Accent Color"
                value={settings.linkAccentColor}
                onChange={(value) => setSettings({ ...settings, linkAccentColor: value })}
              />

              <ColorPicker
                label="Nav Link Color"
                value={settings.navLinkColor}
                onChange={(value) => setSettings({ ...settings, navLinkColor: value })}
              />

              <ColorPicker
                label="Nav Link Hover Color"
                value={settings.navLinkHoverColor}
                onChange={(value) => setSettings({ ...settings, navLinkHoverColor: value })}
              />

              <ColorPicker
                label="Nav Link (Active) Color"
                value={settings.navLinkActiveColor}
                onChange={(value) => setSettings({ ...settings, navLinkActiveColor: value })}
              />

              <ColorPicker
                label="Primary Button Background"
                value={settings.primaryButtonBg}
                onChange={(value) => setSettings({ ...settings, primaryButtonBg: value })}
              />

              <ColorPicker
                label="Primary Button Hover"
                value={settings.primaryButtonHover}
                onChange={(value) => setSettings({ ...settings, primaryButtonHover: value })}
              />

              <ColorPicker
                label="Primary Button Text Color"
                value={settings.primaryButtonText}
                onChange={(value) => setSettings({ ...settings, primaryButtonText: value })}
              />

              <ColorPicker
                label="Secondary Button Background"
                value={settings.secondaryButtonBg}
                onChange={(value) => setSettings({ ...settings, secondaryButtonBg: value })}
              />

              <ColorPicker
                label="Secondary Button Hover"
                value={settings.secondaryButtonHover}
                onChange={(value) => setSettings({ ...settings, secondaryButtonHover: value })}
              />

              <ColorPicker
                label="Secondary Button Text Color"
                value={settings.secondaryButtonText}
                onChange={(value) => setSettings({ ...settings, secondaryButtonText: value })}
              />

              <ColorPicker
                label="Card/Row Background (Default)"
                value={settings.cardBgDefault}
                onChange={(value) => setSettings({ ...settings, cardBgDefault: value })}
              />

              <ColorPicker
                label="Card/Row Background (Hover/Active)"
                value={settings.cardBgHover}
                onChange={(value) => setSettings({ ...settings, cardBgHover: value })}
              />

              <ColorPicker
                label="Input Border/Field Color"
                value={settings.inputBorderColor}
                onChange={(value) => setSettings({ ...settings, inputBorderColor: value })}
              />

              <ColorPicker
                label="Muted Text Color"
                value={settings.mutedTextColor}
                onChange={(value) => setSettings({ ...settings, mutedTextColor: value })}
              />

              <div className="space-y-2">
                <Label htmlFor="fontFamily" className="text-xs">Font Family</Label>
                <Input
                  id="fontFamily"
                  value={settings.fontFamily}
                  onChange={(e) => setSettings({ ...settings, fontFamily: e.target.value })}
                  placeholder="Enter font family"
                  className="text-xs"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="borderRadius" className="text-xs">Border Radius</Label>
                <Input
                  id="borderRadius"
                  value={settings.borderRadius}
                  onChange={(e) => setSettings({ ...settings, borderRadius: e.target.value })}
                  placeholder="e.g., 0.5rem"
                  className="text-xs"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="spacing" className="text-xs">Base Spacing</Label>
                <Input
                  id="spacing"
                  value={settings.spacing}
                  onChange={(e) => setSettings({ ...settings, spacing: e.target.value })}
                  placeholder="e.g., 1rem"
                  className="text-xs"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="backgroundOpacity" className="text-xs">Background Opacity</Label>
                <div className="flex items-center gap-4">
                  <input
                    id="backgroundOpacity"
                    type="range"
                    min={1}
                    max={100}
                    step={1}
                    value={settings.backgroundOpacity}
                    onChange={e => setSettings({ ...settings, backgroundOpacity: parseInt(e.target.value) })}
                    className="w-full h-2 rounded-lg appearance-none bg-secondary/40 focus:outline-none focus:ring-2 focus:ring-accent/60 shadow-sm transition-all duration-200
                      [&::-webkit-slider-thumb]:appearance-none
                      [&::-webkit-slider-thumb]:w-5
                      [&::-webkit-slider-thumb]:h-5
                      [&::-webkit-slider-thumb]:rounded-full
                      [&::-webkit-slider-thumb]:bg-accent
                      [&::-webkit-slider-thumb]:border-2
                      [&::-webkit-slider-thumb]:border-accent-foreground
                      [&::-webkit-slider-thumb]:shadow-md
                      [&::-webkit-slider-thumb]:transition-all
                      [&::-webkit-slider-thumb]:duration-200
                      [&::-moz-range-thumb]:appearance-none
                      [&::-moz-range-thumb]:w-5
                      [&::-moz-range-thumb]:h-5
                      [&::-moz-range-thumb]:rounded-full
                      [&::-moz-range-thumb]:bg-accent
                      [&::-moz-range-thumb]:border-2
                      [&::-moz-range-thumb]:border-accent-foreground
                      [&::-moz-range-thumb]:shadow-md
                      [&::-moz-range-thumb]:transition-all
                      [&::-moz-range-thumb]:duration-200
                      "
                  />
                  <span className="w-12 text-right text-xs">{settings.backgroundOpacity}%</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="backgroundImage" className="text-xs">Background Image URL</Label>
                <Input
                  id="backgroundImage"
                  value={settings.backgroundImage}
                  onChange={e => setSettings({ ...settings, backgroundImage: e.target.value })}
                  placeholder="/images/background.jpg"
                  className="text-xs"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="logoImage" className="text-xs">Logo Image URL</Label>
                <Input
                  id="logoImage"
                  value={settings.logoImage}
                  onChange={e => setSettings({ ...settings, logoImage: e.target.value })}
                  placeholder="/images/logo.png"
                  className="text-xs"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="faviconImage" className="text-xs">Favicon URL</Label>
                <Input
                  id="faviconImage"
                  value={settings.faviconImage}
                  onChange={e => setSettings({ ...settings, faviconImage: e.target.value })}
                  placeholder="/favicon.ico"
                  className="text-xs"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
