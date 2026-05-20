import { adminCollections } from "@/lib/admin/config";
import { getContactRequests } from "@/lib/site";

export default async function AdminDashboardPage() {
  const requests = await getContactRequests();

  return (
    <div className="stack">
      <div className="card stack">
        <h1>Панель управления</h1>
        <p>
          Здесь можно управлять каталогом, статьями, отзывами, сертификатами, командой и глобальными
          настройками сайта.
        </p>
      </div>

      <div className="grid grid-3">
        {Object.entries(adminCollections).map(([key, config]) => (
          <article key={key} className="card stack">
            <strong>{config.title}</strong>
            <span className="muted">{config.description}</span>
          </article>
        ))}
        <article className="card stack">
          <strong>Заявки</strong>
          <span className="muted">Всего входящих заявок: {requests.length}</span>
        </article>
      </div>
    </div>
  );
}
