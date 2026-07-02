import styles from "./visit-chart.module.scss";

type Bar = { date: string; count: number };

type Props = {
  data: Bar[];
  today: number;
  week: number;
  month: number;
};

function formatDateLabel(iso: string) {
  const [, month, day] = iso.split("-");
  return `${day}.${month}`;
}

function shouldShowLabel(index: number, total: number) {
  if (index === 0 || index === total - 1) return true;
  return index % 6 === 0;
}

export function VisitChart({ data, today, week, month }: Props) {
  const max = Math.max(...data.map((d) => d.count), 1);

  return (
    <article className={`admin-card ${styles.chart}`}>
      <h3 className={styles.title}>Посещения за последние 30 дней</h3>

      <div className={styles.plot} role="img" aria-label="График посещений за 30 дней">
        {data.map((point, index) => {
          const heightPercent = point.count > 0 ? Math.max((point.count / max) * 100, 6) : 0;
          const isToday = index === data.length - 1;
          const showLabel = shouldShowLabel(index, data.length);

          return (
            <div
              key={point.date}
              className={styles.barCol}
              title={`${formatDateLabel(point.date)}: ${point.count} визитов`}
            >
              <div className={styles.barTrack}>
                <div
                  className={`${styles.bar} ${isToday ? styles.barToday : ""}`.trim()}
                  style={{ height: `${heightPercent}%` }}
                />
              </div>
              <span className={`${styles.label} ${showLabel ? "" : styles.labelHidden}`.trim()}>
                {formatDateLabel(point.date)}
              </span>
            </div>
          );
        })}
      </div>

      <div className={styles.metrics}>
        <div className={styles.metric}>
          <span className={styles.metricValue}>{today}</span>
          <span className={styles.metricLabel}>Сегодня</span>
        </div>
        <div className={styles.metric}>
          <span className={styles.metricValue}>{week}</span>
          <span className={styles.metricLabel}>За 7 дней</span>
        </div>
        <div className={styles.metric}>
          <span className={styles.metricValue}>{month}</span>
          <span className={styles.metricLabel}>За 30 дней</span>
        </div>
      </div>
    </article>
  );
}
