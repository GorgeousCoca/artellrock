type AttachmentViewProps = {
  siblingData?: Record<string, unknown> | null;
  cellData?: unknown;
  rowData?: Record<string, unknown> | null;
};

const IMAGE_EXTENSION = /\.(jpe?g|png|gif|webp)$/i;

function attachmentUrl(data: Record<string, unknown> | null | undefined) {
  return typeof data?.attachmentUrl === "string" ? data.attachmentUrl : "";
}

function attachmentName(data: Record<string, unknown> | null | undefined, url: string) {
  return typeof data?.attachmentName === "string" && data.attachmentName ? data.attachmentName : url;
}

/** Под полем «Эскиз» в карточке заявки: ссылка и превью картинки. */
export function LeadAttachmentDescription({ siblingData }: AttachmentViewProps) {
  const url = attachmentUrl(siblingData);
  if (!url) return <span>Эскиз не приложен</span>;

  const name = attachmentName(siblingData, url);

  return (
    <span style={{ display: "block", marginTop: 8 }}>
      <a href={url} target="_blank" rel="noreferrer">
        {name}
      </a>
      {IMAGE_EXTENSION.test(url) ? (
        <img alt={name} src={url} style={{ display: "block", maxWidth: 360, marginTop: 12 }} />
      ) : null}
    </span>
  );
}

/** Ячейка списка заявок: имя файла ведёт на эскиз. */
export function LeadAttachmentCell({ cellData, rowData }: AttachmentViewProps) {
  const url = typeof cellData === "string" ? cellData : "";
  if (!url) return <span>—</span>;

  const name = attachmentName(rowData, "Открыть файл");

  return (
    <a href={url} target="_blank" rel="noreferrer">
      {name}
    </a>
  );
}
