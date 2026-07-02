"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

import { brandCatalogHref } from "@/lib/stone/brands";

/** Legacy `?brand=` links — client redirect keeps `/catalog-kamnya` statically exportable. */
export function StoneCatalogBrandRedirect() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const brand = searchParams.get("brand");
    if (brand) {
      router.replace(brandCatalogHref(brand));
    }
  }, [router, searchParams]);

  return null;
}
