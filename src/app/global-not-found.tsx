import type { Metadata } from "next";

import "@/app/globals.scss";

import { SiteNotFound } from "@/components/errors/site-not-found";
import { SiteShell } from "@/components/site/site-shell";

export const metadata: Metadata = {
  title: "Страница не найдена — ArtellRock",
  robots: { index: false, follow: false }
};

/** 404 для URL, не попавших ни в публичный сайт, ни в Payload (/admin, /api). */
export default function GlobalNotFound() {
  return (
    <html lang="ru">
      <body>
        <SiteShell>
          <SiteNotFound />
        </SiteShell>
      </body>
    </html>
  );
}
