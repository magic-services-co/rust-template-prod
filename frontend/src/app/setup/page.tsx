"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { backendApi } from "@/lib/api";
import { fetchSanctumCsrfCookie, xsrfHeaderInit } from "@/lib/sanctum-csrf";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type SetupStatus = {
  wizardPending?: boolean;
  wizardCompleted?: boolean;
  hasSiteLicense?: boolean;
  steamConfigured?: boolean;
  ownerClaimed?: boolean;
};

const STEPS = [
  "License",
  "Steam",
  "Sign in",
  "Discord",
  "PayNow",
  "BattleMetrics",
  "RustMaps",
  "Finish",
] as const;

export default function SetupPage() {
  const [status, setStatus] = useState<SetupStatus | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [licenseServerUrl, setLicenseServerUrl] = useState("");
  const [licenseServerApiKey, setLicenseServerApiKey] = useState("");
  const [siteLicenseKey, setSiteLicenseKey] = useState("");
  const [steamSecret, setSteamSecret] = useState("");
  const [discordClientId, setDiscordClientId] = useState("");
  const [discordClientSecret, setDiscordClientSecret] = useState("");
  const [discordBotToken, setDiscordBotToken] = useState("");
  const [paynowStoreId, setPaynowStoreId] = useState("");
  const [paynowApiKey, setPaynowApiKey] = useState("");
  const [bmOrgId, setBmOrgId] = useState("");
  const [bmApiKey, setBmApiKey] = useState("");
  const [bmAuthorizeUrl, setBmAuthorizeUrl] = useState("");
  const [rustmapsApiKey, setRustmapsApiKey] = useState("");
  const [rustmapsOrgId, setRustmapsOrgId] = useState("");

  const refreshStatus = useCallback(async () => {
    setLoadError(null);
    try {
      const res = await fetch(backendApi("setup/status"), {
        credentials: "include",
        headers: { Accept: "application/json" },
      });
      const data = (await res.json()) as SetupStatus;
      setStatus(data);
      return data;
    } catch {
      setLoadError("Could not reach the API. Is the backend running?");
      return null;
    }
  }, []);

  useEffect(() => {
    void refreshStatus();
  }, [refreshStatus]);

  useEffect(() => {
    if (!status?.wizardPending) return;
    if (status.hasSiteLicense) setStep((s) => Math.max(s, 1));
    if (status.steamConfigured) setStep((s) => Math.max(s, 2));
    if (status.ownerClaimed) setStep((s) => Math.max(s, 3));
  }, [status?.wizardPending, status?.hasSiteLicense, status?.steamConfigured, status?.ownerClaimed]);

  async function postJson(path: string, body: Record<string, unknown>) {
    setBusy(true);
    setFormError(null);
    try {
      await fetchSanctumCsrfCookie();
      const res = await fetch(backendApi(path), {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          ...xsrfHeaderInit(),
        },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const d = data as { message?: string; error?: string };
        setFormError(d.message ?? d.error ?? `Request failed (${res.status})`);
        return false;
      }
      return data;
    } catch {
      setFormError("Network error.");
      return false;
    } finally {
      setBusy(false);
    }
  }

  if (loadError) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-6">
        <p className="text-destructive text-center">{loadError}</p>
        <Button type="button" variant="outline" onClick={() => void refreshStatus()}>
          Retry
        </Button>
      </main>
    );
  }

  if (status && !status.wizardPending) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-6">
        <p className="text-muted-foreground text-center">Setup wizard is not active for this install.</p>
        <Button asChild>
          <Link href="/">Go home</Link>
        </Button>
      </main>
    );
  }

  if (!status) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6">
        <p className="text-muted-foreground">Loading…</p>
      </main>
    );
  }

  const stepLabel = STEPS[Math.min(step, STEPS.length - 1)];

  return (
    <main className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto flex max-w-lg flex-col gap-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Site setup</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Step {Math.min(step + 1, STEPS.length)} of {STEPS.length}: {stepLabel}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{stepLabel}</CardTitle>
            <CardDescription>
              {step === 0 &&
                "Connect to your license server and activate this installation."}
              {step === 1 && "Steam Web API key used for Steam sign-in (same as STEAM_SECRET in .env)."}
              {step === 2 && "Sign in with Steam once. The first Steam account becomes Owner."}
              {step === 3 && "Discord application ID, OAuth secret, and bot token."}
              {step === 4 && "PayNow store identifier and API key."}
              {step === 5 &&
                "BattleMetrics organization API token, org ID, and OAuth app URL (for RCON / org tools)."}
              {step === 6 && "RustMaps API key for map voting and previews (optional org ID)."}
              {step === 7 && "Mark setup complete and open the site."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {formError && <p className="text-destructive text-sm">{formError}</p>}

            {step === 0 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="ls-url">License server URL (optional if already in backend .env)</Label>
                  <Input
                    id="ls-url"
                    value={licenseServerUrl}
                    onChange={(e) => setLicenseServerUrl(e.target.value)}
                    placeholder="https://license.example.com"
                    className="mt-1"
                    autoComplete="off"
                  />
                </div>
                <div>
                  <Label htmlFor="ls-api">License server API key</Label>
                  <Input
                    id="ls-api"
                    type="password"
                    value={licenseServerApiKey}
                    onChange={(e) => setLicenseServerApiKey(e.target.value)}
                    placeholder="Stored in backend/storage/app/.license_server_api_key"
                    className="mt-1"
                    autoComplete="off"
                  />
                </div>
                <div>
                  <Label htmlFor="site-key">Site license key</Label>
                  <Input
                    id="site-key"
                    value={siteLicenseKey}
                    onChange={(e) => setSiteLicenseKey(e.target.value)}
                    placeholder="Activates this domain/instance"
                    className="mt-1"
                    autoComplete="off"
                  />
                </div>
                <Button
                  type="button"
                  disabled={busy || !licenseServerApiKey.trim() || !siteLicenseKey.trim()}
                  onClick={async () => {
                    const data = await postJson("setup/license", {
                      licenseServerUrl: licenseServerUrl.trim() || undefined,
                      licenseServerApiKey: licenseServerApiKey.trim(),
                      siteLicenseKey: siteLicenseKey.trim(),
                    });
                    if (!data) return;
                    if ((data as { success?: boolean }).success === true) {
                      await refreshStatus();
                      setStep(1);
                    } else {
                      setFormError((data as { message?: string }).message ?? "License activation failed.");
                    }
                  }}
                >
                  Continue
                </Button>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="steam-secret">Steam Web API key</Label>
                  <Input
                    id="steam-secret"
                    type="password"
                    value={steamSecret}
                    onChange={(e) => setSteamSecret(e.target.value)}
                    placeholder="STEAM_SECRET"
                    className="mt-1"
                    autoComplete="off"
                  />
                </div>
                <Button
                  type="button"
                  disabled={busy || !steamSecret.trim()}
                  onClick={async () => {
                    const data = await postJson("setup/steam-secret", { steamSecret: steamSecret.trim() });
                    if (data && (data as { success?: boolean }).success) {
                      await refreshStatus();
                      setStep(2);
                    }
                  }}
                >
                  Continue
                </Button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <p className="text-muted-foreground text-sm">
                  You will be redirected to Steam, then back here. After signing in, continue to Discord setup.
                </p>
                <Button
                  type="button"
                  onClick={() => {
                    if (typeof window === "undefined") return;
                    sessionStorage.setItem("setup_wizard_post_auth_redirect", "/setup");
                    const origin = window.location.origin;
                    window.location.href = `${origin}/api/auth/redirect/steam?return_origin=${encodeURIComponent(origin)}`;
                  }}
                >
                  Sign in with Steam
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={busy}
                  onClick={async () => {
                    await refreshStatus();
                    const s = await fetch(backendApi("auth/session"), {
                      credentials: "include",
                      headers: { Accept: "application/json" },
                    }).then((r) => r.json());
                    const user = s?.user;
                    if (user?.steamId) {
                      setStep(3);
                    } else {
                      setFormError("No Steam session yet. Complete Steam sign-in, then click again.");
                    }
                  }}
                >
                  I signed in — continue
                </Button>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="dc-id">Discord application ID</Label>
                  <Input
                    id="dc-id"
                    value={discordClientId}
                    onChange={(e) => setDiscordClientId(e.target.value)}
                    className="mt-1"
                    autoComplete="off"
                  />
                </div>
                <div>
                  <Label htmlFor="dc-secret">Discord client secret</Label>
                  <Input
                    id="dc-secret"
                    type="password"
                    value={discordClientSecret}
                    onChange={(e) => setDiscordClientSecret(e.target.value)}
                    className="mt-1"
                    autoComplete="off"
                  />
                </div>
                <div>
                  <Label htmlFor="dc-bot">Discord bot token</Label>
                  <Input
                    id="dc-bot"
                    type="password"
                    value={discordBotToken}
                    onChange={(e) => setDiscordBotToken(e.target.value)}
                    className="mt-1"
                    autoComplete="off"
                  />
                </div>
                <Button
                  type="button"
                  disabled={
                    busy || !discordClientId.trim() || !discordClientSecret.trim() || !discordBotToken.trim()
                  }
                  onClick={async () => {
                    const data = await postJson("setup/discord", {
                      clientId: discordClientId.trim(),
                      clientSecret: discordClientSecret.trim(),
                      botToken: discordBotToken.trim(),
                    });
                    if (data && (data as { success?: boolean }).success) setStep(4);
                  }}
                >
                  Continue
                </Button>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="pn-store">PayNow store ID</Label>
                  <Input
                    id="pn-store"
                    value={paynowStoreId}
                    onChange={(e) => setPaynowStoreId(e.target.value)}
                    className="mt-1"
                    autoComplete="off"
                  />
                </div>
                <div>
                  <Label htmlFor="pn-key">PayNow API key</Label>
                  <Input
                    id="pn-key"
                    type="password"
                    value={paynowApiKey}
                    onChange={(e) => setPaynowApiKey(e.target.value)}
                    className="mt-1"
                    autoComplete="off"
                  />
                </div>
                <Button
                  type="button"
                  disabled={busy || !paynowStoreId.trim() || !paynowApiKey.trim()}
                  onClick={async () => {
                    const data = await postJson("setup/paynow", {
                      storeId: paynowStoreId.trim(),
                      apiKey: paynowApiKey.trim(),
                    });
                    if (data && (data as { success?: boolean }).success) setStep(5);
                  }}
                >
                  Continue
                </Button>
              </div>
            )}

            {step === 5 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="bm-org">BattleMetrics organization ID</Label>
                  <Input
                    id="bm-org"
                    value={bmOrgId}
                    onChange={(e) => setBmOrgId(e.target.value)}
                    className="mt-1"
                    autoComplete="off"
                  />
                </div>
                <div>
                  <Label htmlFor="bm-key">BattleMetrics API key</Label>
                  <Input
                    id="bm-key"
                    type="password"
                    value={bmApiKey}
                    onChange={(e) => setBmApiKey(e.target.value)}
                    className="mt-1"
                    autoComplete="off"
                  />
                </div>
                <div>
                  <Label htmlFor="bm-oauth">OAuth authorize URL (paste from BattleMetrics app)</Label>
                  <Textarea
                    id="bm-oauth"
                    value={bmAuthorizeUrl}
                    onChange={(e) => setBmAuthorizeUrl(e.target.value)}
                    placeholder={`https://www.battlemetrics.com/authorize?response_type=code&client_id=…&redirect_uri=…&scope=…`}
                    className="mt-1 min-h-[100px] font-mono text-xs"
                    autoComplete="off"
                  />
                  <p className="text-muted-foreground mt-1 text-xs">
                    Register an OAuth app with a redirect URI you control (for example your control panel URL).
                    Pasting the full authorize link saves <code className="text-xs">client_id</code> and{" "}
                    <code className="text-xs">redirect_uri</code> for reference.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    disabled={busy || !bmOrgId.trim() || !bmApiKey.trim()}
                    onClick={async () => {
                      const data = await postJson("setup/battlemetrics", {
                        orgId: bmOrgId.trim(),
                        apiKey: bmApiKey.trim(),
                        oauthAuthorizeUrl: bmAuthorizeUrl.trim() || undefined,
                      });
                      if (data && (data as { success?: boolean }).success) setStep(6);
                    }}
                  >
                    Continue
                  </Button>
                  <Button type="button" variant="ghost" disabled={busy} onClick={() => setStep(6)}>
                    Skip BattleMetrics
                  </Button>
                </div>
              </div>
            )}

            {step === 6 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="rm-key">RustMaps API key</Label>
                  <Input
                    id="rm-key"
                    type="password"
                    value={rustmapsApiKey}
                    onChange={(e) => setRustmapsApiKey(e.target.value)}
                    className="mt-1"
                    autoComplete="off"
                  />
                </div>
                <div>
                  <Label htmlFor="rm-org">RustMaps organization ID (optional)</Label>
                  <Input
                    id="rm-org"
                    value={rustmapsOrgId}
                    onChange={(e) => setRustmapsOrgId(e.target.value)}
                    className="mt-1"
                    autoComplete="off"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    disabled={busy || !rustmapsApiKey.trim()}
                    onClick={async () => {
                      const data = await postJson("setup/rustmaps", {
                        apiKey: rustmapsApiKey.trim(),
                        orgId: rustmapsOrgId.trim() || undefined,
                      });
                      if (data && (data as { success?: boolean }).success) setStep(7);
                    }}
                  >
                    Continue
                  </Button>
                  <Button type="button" variant="ghost" disabled={busy} onClick={() => setStep(7)}>
                    Skip RustMaps
                  </Button>
                </div>
              </div>
            )}

            {step === 7 && (
              <div className="space-y-4">
                <p className="text-muted-foreground text-sm">
                  This clears the install pending flag. You can change any of these values later in the admin
                  panel.
                </p>
                <Button
                  type="button"
                  disabled={busy}
                  onClick={async () => {
                    const data = await postJson("setup/complete", {});
                    if (data && (data as { success?: boolean }).success) {
                      window.location.href = "/";
                    }
                  }}
                >
                  Finish setup
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
