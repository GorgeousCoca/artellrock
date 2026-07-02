import type { Metadata } from "next";

import "./admin.scss";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: {
    default: "Админка ArtellRock",
    template: "%s — админка ArtellRock"
  }
};

export default function AdminRootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
