import { getContactRequests } from "@/lib/site";

type AdminRequestsPageProps = {
  searchParams: Promise<{ status?: string }>;
};

export default async function AdminRequestsPage({ searchParams }: AdminRequestsPageProps) {
  const query = await searchParams;
  const requests = await getContactRequests();
  const selectedStatus = query.status ?? "all";
  const statusLabel: Record<string, string> = {
    delivered: "Письмо отправлено",
    failed_mail: "Ошибка SMTP",
    pending: "Ожидает отправки"
  };
  const statusOptions = [
    { value: "all", label: "Все заявки" },
    { value: "delivered", label: "Письмо отправлено" },
    { value: "failed_mail", label: "Ошибки SMTP" },
    { value: "pending", label: "Ожидает отправки" }
  ] as const;
  const filteredRequests =
    selectedStatus === "all" ? requests : requests.filter((request) => (request.deliveryStatus ?? "pending") === selectedStatus);
  const failedSmtpCount = requests.filter((request) => request.deliveryStatus === "failed_mail").length;

  return (
    <div className="stack">
      <div className="card stack">
        <h1>Заявки</h1>
        <p className="muted">Все формы сайта сохраняются в единую ленту заявок.</p>
        <div className="pill-list">
          <span className="pill">Всего: {requests.length}</span>
          <span className="pill">Ошибки SMTP: {failedSmtpCount}</span>
          <span className="pill">За 24ч проверь вручную: {failedSmtpCount > 0 ? "Да" : "Нет"}</span>
        </div>
        <form method="get" className="admin-toolbar" style={{ marginBottom: 0 }}>
          <label className="stack" style={{ gap: 6 }}>
            <span className="muted">Фильтр статуса</span>
            <select className="select" name="status" defaultValue={selectedStatus}>
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <button className="button-secondary" type="submit">
            Применить
          </button>
        </form>
      </div>

      {filteredRequests.length ? (
        filteredRequests.map((request) => (
          <article key={request.id} className="card stack">
            <div className="admin-toolbar">
              <div className="stack" style={{ gap: 4 }}>
                <strong>{request.name}</strong>
                <span className="muted">
                  {request.phone} · {request.email}
                </span>
              </div>
              <div className="pill-list">
                <span className="pill">{request.source}</span>
                <span className="pill">{statusLabel[request.deliveryStatus ?? "pending"]}</span>
              </div>
            </div>
            <p>{request.message}</p>
            <div className="btn-row">
              <a className="button-secondary" href={`tel:${request.phone.replace(/[^\d+]/g, "")}`}>
                Позвонить
              </a>
              <a className="button-secondary" href={`mailto:${request.email}`}>
                Написать на email
              </a>
            </div>
            {request.mailError ? <span className="muted">SMTP: {request.mailError}</span> : null}
            <span className="muted">{new Date(request.createdAt).toLocaleString("ru-RU")}</span>
          </article>
        ))
      ) : (
        <div className="card stack">
          <strong>{requests.length ? "Нет заявок под текущий фильтр" : "Заявок пока нет"}</strong>
          <p>
            {requests.length
              ? "Измените фильтр статуса, чтобы посмотреть другие обращения."
              : "После отправки форм с сайта новые обращения появятся здесь автоматически."}
          </p>
        </div>
      )}
    </div>
  );
}
