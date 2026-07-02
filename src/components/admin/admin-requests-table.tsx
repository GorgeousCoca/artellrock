import Link from "next/link";

import type { ContactRequest } from "@/types/content";

const statusLabel: Record<string, string> = {
  delivered: "Отправлено",
  failed_mail: "Ошибка SMTP",
  pending: "Ожидает"
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function formatSize(bytes?: number) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function AdminRequestsMobileList({ requests }: { requests: ContactRequest[] }) {
  return (
    <ul className="admin-requests-mobile">
      {requests.map((request) => (
        <li key={request.id} className="admin-request-card">
          <div className="admin-request-card__head">
            <p className="admin-request-card__name">{request.name}</p>
            <time className="admin-request-card__date" dateTime={request.createdAt}>
              {formatDate(request.createdAt)}
            </time>
          </div>
          <div className="admin-request-card__contacts">
            <a href={`tel:${request.phone.replace(/[^\d+]/g, "")}`}>{request.phone}</a>
            <a href={`mailto:${request.email}`}>{request.email}</a>
          </div>
          <div className="admin-request-card__meta">
            <span className="badge">{request.source}</span>
            <span
              className={`badge badge--${
                request.deliveryStatus === "delivered"
                  ? "success"
                  : request.deliveryStatus === "failed_mail"
                    ? "danger"
                    : "warning"
              }`}
            >
              {statusLabel[request.deliveryStatus ?? "pending"]}
            </span>
            {request.attachmentUrl ? (
              <a
                className="admin-attachment-link"
                href={request.attachmentUrl}
                target="_blank"
                rel="noreferrer"
              >
                {request.attachmentName ?? "Файл"}
                {request.attachmentSize ? ` (${formatSize(request.attachmentSize)})` : ""}
              </a>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );
}

type AdminRequestsTableProps = {
  requests: ContactRequest[];
  compact?: boolean;
};

export function AdminRequestsTable({ requests, compact = false }: AdminRequestsTableProps) {
  if (!requests.length) {
    return <div className="admin-empty">Заявок пока нет — они появятся после отправки формы на сайте.</div>;
  }

  return (
    <>
      <AdminRequestsMobileList requests={requests} />
      <div className="admin-requests-table-wrap">
        <table className="admin-requests-table">
        <thead>
          <tr>
            <th>Дата</th>
            <th>Клиент</th>
            {!compact ? <th>Заявка</th> : null}
            <th>Файл</th>
            <th>Статус</th>
          </tr>
        </thead>
        <tbody>
          {requests.map((request) => (
            <tr key={request.id}>
              <td>{formatDate(request.createdAt)}</td>
              <td>
                <strong>{request.name}</strong>
                <br />
                <a href={`tel:${request.phone.replace(/[^\d+]/g, "")}`}>{request.phone}</a>
                <br />
                <a href={`mailto:${request.email}`}>{request.email}</a>
                <br />
                <span className="badge">{request.source}</span>
              </td>
              {!compact ? (
                <td>
                  <div className="admin-request-message">{request.message || "—"}</div>
                </td>
              ) : null}
              <td>
                {request.attachmentUrl ? (
                  <a
                    className="admin-attachment-link"
                    href={request.attachmentUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {request.attachmentName ?? "Скачать"}
                    {request.attachmentSize ? ` (${formatSize(request.attachmentSize)})` : ""}
                  </a>
                ) : (
                  <span className="muted">—</span>
                )}
              </td>
              <td>
                <span
                  className={`badge badge--${
                    request.deliveryStatus === "delivered"
                      ? "success"
                      : request.deliveryStatus === "failed_mail"
                        ? "danger"
                        : "warning"
                  }`}
                >
                  {statusLabel[request.deliveryStatus ?? "pending"]}
                </span>
                {request.mailError ? (
                  <>
                    <br />
                    <span className="form-error" style={{ fontSize: "0.75rem" }}>
                      {request.mailError}
                    </span>
                  </>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    </>
  );
}

export function AdminRequestsSection({
  requests,
  title = "Последние заявки",
  limit = 15
}: {
  requests: ContactRequest[];
  title?: string;
  limit?: number;
}) {
  const slice = requests.slice(0, limit);

  return (
    <section className="admin-section">
      <div className="admin-section__head">
        <h2>{title}</h2>
        <Link href="/admin/requests">Все заявки →</Link>
      </div>
      <AdminRequestsTable requests={slice} compact />
    </section>
  );
}
