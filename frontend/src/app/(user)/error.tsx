"use client";

import { useEffect } from "react";
import { ErrorCta, ErrorHint, ErrorPage } from "@/components/error-page";

export default function UserErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <ErrorPage
      kicker="SERVER ERROR"
      title="500"
      titleAccent="FAILED"
      subtitle="Something went wrong while loading this page. Try again, or return home."
      actions={
        <>
          <ErrorCta onClick={() => reset()}>TRY AGAIN</ErrorCta>
          <ErrorCta href="/" variant="secondary">
            RETURN HOME
          </ErrorCta>
        </>
      }
    >
      {process.env.NODE_ENV === "development" ? (
        <ErrorHint>
          <p className="font-mono text-[11px] tracking-[0.4px] text-[#e8a0a3]">
            {error.message || "Unknown error"}
          </p>
          {error.digest ? (
            <p className="pt-2 font-mono text-[11px] text-[#8292a6]">digest {error.digest}</p>
          ) : null}
        </ErrorHint>
      ) : null}
    </ErrorPage>
  );
}
