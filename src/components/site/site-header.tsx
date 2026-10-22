import Image from "next/image";
import Link from "next/link";

import logoMark from "@/app/icon.png";
import { COMPANY_NAME, PHONE, PHONE_HREF, headerNav, navItems } from "@/content/artellrock";
import { OrderCallButton } from "@/components/site/callback-dialog";

import { MobileMenu } from "./mobile-menu";
import { NavLinks } from "./nav-links";

export function SiteHeader() {
  return (
    <header className="site-nav-bar">
      <div className="site-nav-bar__inner">
        <Link className="logo" href="/" translate="no" aria-label={`${COMPANY_NAME} — на главную`}>
          <span className="logo__mark" aria-hidden="true">
            <Image src={logoMark} alt="" fill sizes="96px" className="logo__mark-img" priority />
          </span>
          {COMPANY_NAME}
        </Link>

        <NavLinks items={headerNav} label="Основная навигация" className="site-nav" />

        <div className="nav-tools">
          <a className="nav-phone" href={PHONE_HREF}>
            <svg className="nav-phone__icon" viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M7 3.5h2.2l1.2 3-1.6 1a12 12 0 0 0 5.7 5.7l1-1.6 3 1.2V17a2 2 0 0 1-2.2 2A15.5 15.5 0 0 1 5 6.7 2 2 0 0 1 7 3.5Z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinejoin="round"
              />
            </svg>
            {PHONE}
          </a>
          <OrderCallButton className="nav-callback" label="Обратный звонок" source="header" idPrefix="header-call" />
        </div>

        <MobileMenu items={navItems} />
      </div>
    </header>
  );
}
