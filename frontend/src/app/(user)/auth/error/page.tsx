"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { signIn } from "@/lib/laravel-auth-react";
import { ErrorCta, ErrorHint, ErrorPage } from "@/components/error-page";

type ErrorPayload = { error: string; message: string; hint: string } | null;

function getErrorFromUrl(): string {
  if (typeof window === "undefined") return "Default";
  const params = new URLSearchParams(window.location.search);
  return params.get("error")?.trim() || "Default";
}

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const [data, setData] = useState<ErrorPayload>(null);

  useEffect(() => {
    const errorCode = getErrorFromUrl();
    const urlMessage =
      typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("message") : null;
    const query = new URLSearchParams({ error: errorCode });
    if (urlMessage) query.set("message", urlMessage);
    fetch(`/api/auth/error?${query.toString()}`)
      .then((res) => res.json())
      .then((json) => setData(json))
      .catch(() =>
        setData({
          error: "Default",
          message: urlMessage || "An error occurred during sign-in.",
          hint: "Try again or return home.",
        }),
      );
  }, [searchParams]);

  return (
    <ErrorPage
      kicker="SIGN IN"
      title="SIGN-IN"
      titleAccent="ERROR"
      subtitle={data?.message || "Loading…"}
      actions={
        <>
          <ErrorCta onClick={() => signIn("steam")}>TRY AGAIN WITH STEAM</ErrorCta>
          {data?.error === "OAuthError" ? (
            <ErrorCta onClick={() => signIn("discord")}>TRY AGAIN WITH DISCORD</ErrorCta>
          ) : null}
          <ErrorCta href="/" variant="secondary">
            RETURN HOME
          </ErrorCta>
        </>
      }
    >
      {data ? (
        <ErrorHint>
          <p className="font-mono text-[11px] uppercase tracking-[1.4px] text-[#ba9142]">
            Error code · {data.error}
          </p>
          {data.hint ? <p className="pt-2">{data.hint}</p> : null}
        </ErrorHint>
      ) : null}
    </ErrorPage>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense
      fallback={
        <ErrorPage
          kicker="SIGN IN"
          title="SIGN-IN"
          titleAccent="ERROR"
          subtitle="Loading…"
        />
      }
    >
      <AuthErrorContent />
    </Suspense>
  );
}
