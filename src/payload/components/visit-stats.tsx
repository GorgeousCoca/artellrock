import { getLast30Days, getVisitStats, sumLast30Days, sumLast7Days } from "../../lib/analytics";

/** Блок над списком коллекций на дашборде Payload: посещаемость сайта (analytics.json). */
export default async function VisitStats() {
  const stats = await getVisitStats();
  const today = stats[new Date().toISOString().slice(0, 10)] ?? 0;
  const week = sumLast7Days(stats);
  const month = sumLast30Days(stats);
  const days = getLast30Days(stats);
  const max = Math.max(1, ...days.map((day) => day.count));

  const metric = (label: string, value: number) => (
    <div style={{ flex: "1 1 120px" }}>
      <div style={{ fontSize: 28, fontWeight: 600 }}>{value}</div>
      <div style={{ opacity: 0.7, fontSize: 13 }}>{label}</div>
    </div>
  );

  return (
    <section style={{ marginBottom: 32 }}>
      <h2 style={{ marginTop: 0 }}>Посещения сайта</h2>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 16 }}>
        {metric("Сегодня", today)}
        {metric("За 7 дней", week)}
        {metric("За 30 дней", month)}
      </div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 64 }} aria-hidden="true">
        {days.map((day) => (
          <div
            key={day.date}
            title={`${day.date}: ${day.count}`}
            style={{
              flex: 1,
              height: `${Math.max(4, (day.count / max) * 100)}%`,
              background: "var(--theme-elevation-400)",
              borderRadius: 2
            }}
          />
        ))}
      </div>
    </section>
  );
}
