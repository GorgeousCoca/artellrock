import { AdminRequestsTable } from "@/components/admin/admin-requests-table";
import { getContactRequests } from "@/lib/site";

type SearchParams = {
  search?: string;
  status?: string;
  source?: string;
  from?: string;
  to?: string;
  order?: string;
};

export default async function AdminRequestsPage({
  searchParams
}: {
  searchParams: Promise<SearchParams>;
}) {
  const query = await searchParams;
  const requests = await getContactRequests();

  const search = (query.search ?? "").toLowerCase();
  const status = query.status ?? "all";
  const source = query.source ?? "all";
  const from = query.from ?? "";
  const to = query.to ?? "";
  const order = query.order ?? "desc";

  const sources = [...new Set(requests.map((r) => r.source).filter(Boolean))];

  const filtered = requests
    .filter((r) => {
      if (status !== "all" && (r.deliveryStatus ?? "pending") !== status) return false;
      if (source !== "all" && r.source !== source) return false;
      if (from && r.createdAt < from) return false;
      if (to && r.createdAt > `${to}T23:59:59Z`) return false;
      if (search) {
        const hay = `${r.name} ${r.phone} ${r.email} ${r.message}`.toLowerCase();
        if (!hay.includes(search)) return false;
      }
      return true;
    })
    .sort((a, b) => {
      const diff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return order === "asc" ? diff : -diff;
    });

  const withFiles = requests.filter((r) => r.attachmentUrl).length;

  return (
    <div className="stack">
      <header className="admin-page-head">
        <h1>Заявки</h1>
        <p>
          История обращений с сайта. Вложения (эскизы и фото) сохраняются в{" "}
          <code>public/uploads/leads/</code>.
        </p>
      </header>

      <div className="admin-card admin-metrics" style={{ padding: 0 }}>
        <div className="admin-metric">
          <div className="admin-metric__value">{requests.length}</div>
          <div className="admin-metric__label">Всего заявок</div>
        </div>
        <div className="admin-metric">
          <div className="admin-metric__value">{withFiles}</div>
          <div className="admin-metric__label">С файлами</div>
        </div>
        <div className="admin-metric">
          <div className="admin-metric__value">{filtered.length}</div>
          <div className="admin-metric__label">По фильтру</div>
        </div>
      </div>

      <form method="get" className="admin-card">
        <div className="admin-filters">
          <div className="form-group" style={{ flex: "1 1 200px" }}>
            <label className="form-label">Поиск</label>
            <input
              name="search"
              type="search"
              className="form-input"
              defaultValue={query.search}
              placeholder="Имя, телефон, email..."
            />
          </div>

          <div className="form-group" style={{ flex: "0 0 160px" }}>
            <label className="form-label">Статус</label>
            <select name="status" className="form-select" defaultValue={status}>
              <option value="all">Все</option>
              <option value="delivered">Отправлено</option>
              <option value="failed_mail">Ошибка SMTP</option>
              <option value="pending">Ожидает</option>
            </select>
          </div>

          {sources.length > 1 ? (
            <div className="form-group" style={{ flex: "0 0 160px" }}>
              <label className="form-label">Источник</label>
              <select name="source" className="form-select" defaultValue={source}>
                <option value="all">Все</option>
                {sources.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          <div className="form-group" style={{ flex: "0 0 140px" }}>
            <label className="form-label">От</label>
            <input name="from" type="date" className="form-input" defaultValue={from} />
          </div>

          <div className="form-group" style={{ flex: "0 0 140px" }}>
            <label className="form-label">До</label>
            <input name="to" type="date" className="form-input" defaultValue={to} />
          </div>

          <div className="form-group" style={{ flex: "0 0 140px" }}>
            <label className="form-label">Порядок</label>
            <select name="order" className="form-select" defaultValue={order}>
              <option value="desc">Новые первые</option>
              <option value="asc">Старые первые</option>
            </select>
          </div>

          <button className="button" type="submit">
            Применить
          </button>
          <a className="button-secondary" href="/admin/requests">
            Сбросить
          </a>
        </div>
      </form>

      <AdminRequestsTable requests={filtered} />
    </div>
  );
}
