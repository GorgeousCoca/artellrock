import type { CompanySettings } from "@/types/content";

import { PlatformLinks } from "@/components/ui/platform-links";

import styles from "./trust-platforms-strip.module.scss";

type TrustPlatformsStripProps = {
  settings: CompanySettings;
};

export function TrustPlatformsStrip({ settings }: TrustPlatformsStripProps) {
  const stats = [
    { value: settings.statsClients ?? "100+", label: "довольных клиентов" },
    { value: settings.statsBrands ?? "13", label: "брендов камня" },
    { value: settings.statsYears ?? "5", label: "лет на рынке" }
  ];

  return (
    <section
      className={`home-flow-section trust-platforms-strip ${styles.strip}`}
      aria-label="Доверие и площадки"
    >
      <div className="container">
        <div className={styles.inner}>
          <PlatformLinks layout="grid" />
          <div className={styles.stats} role="list">
            {stats.map((stat) => (
              <div key={stat.label} className={styles.statItem} role="listitem">
                <span className="stat-number">{stat.value}</span>
                <span className="stat-label">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
