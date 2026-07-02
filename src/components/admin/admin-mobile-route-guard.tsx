"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

const MOBILE_ADMIN_MAX_WIDTH = 959;

function isMobileViewport() {
  return window.matchMedia(`(max-width: ${MOBILE_ADMIN_MAX_WIDTH}px)`).matches;
}

export function AdminMobileRouteGuard() {
  const pathname = usePathname() ?? "";
  const router = useRouter();

  useEffect(() => {
    const redirectIfNeeded = () => {
      if (isMobileViewport() && pathname !== "/admin") {
        router.replace("/admin");
      }
    };

    redirectIfNeeded();

    const media = window.matchMedia(`(max-width: ${MOBILE_ADMIN_MAX_WIDTH}px)`);
    media.addEventListener("change", redirectIfNeeded);
    return () => media.removeEventListener("change", redirectIfNeeded);
  }, [pathname, router]);

  return null;
}
