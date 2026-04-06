type OnRequestErrorContext = {
  routePath?: string;
  routeType?: string;
  renderSource?: string;
};

export async function onRequestError(
  err: unknown,
  _request: unknown,
  context: OnRequestErrorContext | undefined
): Promise<void> {
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
}
