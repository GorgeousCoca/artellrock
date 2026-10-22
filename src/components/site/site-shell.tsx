import { CookieNotice } from "@/components/legal/cookie-notice";

import { BottomBar } from "./bottom-bar";
import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";

export function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a className="skip-link" href="#main">
        К содержимому
      </a>
      <SiteHeader />
      <main id="main" className="site-main">
        {children}
      </main>
      <SiteFooter />
      <BottomBar />
      <CookieNotice />
    </>
  );
}
