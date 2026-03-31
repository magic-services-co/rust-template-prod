"use client";

import React, { useEffect, useRef } from "react";

export function RustalyzerWidget({ serverId }: { serverId: string }) {
  const elRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = elRef.current;
    if (!el || !serverId) return;
    el.setAttribute("server-id", serverId);
  }, [serverId]);

  if (!serverId) return null;

  return React.createElement("rustalyzer-widget", {
    ref: elRef,
    style: { minHeight: 200 },
  });
}
