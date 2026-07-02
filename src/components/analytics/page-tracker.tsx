"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

export function PageTracker() {
  const pathname = usePathname();

  useEffect(() => {
    void fetch("/api/track-visit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: pathname })
    }).catch(() => {});
  }, [pathname]);

  return null;
}
