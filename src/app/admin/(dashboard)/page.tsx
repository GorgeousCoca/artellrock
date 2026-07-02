import { AdminRequestsSection } from "@/components/admin/admin-requests-table";
import { VisitChart } from "@/components/admin/visit-chart";
import { getLast30Days, getVisitStats, sumLast30Days, sumLast7Days } from "@/lib/analytics";
import { getContactRequests } from "@/lib/site";

export default async function AdminDashboardPage() {
  const [requests, stats] = await Promise.all([getContactRequests(), getVisitStats()]);

  const last30 = getLast30Days(stats);
  const today = stats[new Date().toISOString().slice(0, 10)] ?? 0;
  const week = sumLast7Days(stats);
  const month = sumLast30Days(stats);

  return (
    <div className="stack">
      <header className="admin-page-head">
        <h1>Обзор</h1>
        <p>Посещения сайта и входящие заявки с вложениями от клиентов.</p>
      </header>

      <VisitChart data={last30} today={today} week={week} month={month} />

      <AdminRequestsSection requests={requests} limit={12} />
    </div>
  );
}
