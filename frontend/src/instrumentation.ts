import type { Instrumentation } from "next";

export const onRequestError: Instrumentation["onRequestError"] = async (
  err,
  _request,
  context
) => {
  const error = err instanceof Error ? err : new Error(String(err));
  console.error(
    "[Next.js Server Error]",
    error.message,
    "\n  routePath:",
    context?.routePath,
    "routeType:",
    context?.routeType,
    "renderSource:",
    context?.renderSource
  );
  if (error.stack) {
    console.error("[Next.js Server Error] Full stack:\n", error.stack);
  }
};
