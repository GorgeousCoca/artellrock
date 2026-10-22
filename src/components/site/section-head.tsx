type SectionHeadProps = {
  id?: string;
  title: string;
  lead?: string;
  children?: React.ReactNode;
  /** Заголовок и текст по центру. */
  align?: "center";
};

/** Заголовок блока и (необязательно) одно предложение под ним; справа — слот под управление. */
export function SectionHead({ id, title, lead, children, align }: SectionHeadProps) {
  return (
    <div className={align === "center" ? "block-head block-head--center" : "block-head"}>
      <div>
        <h2 id={id} className="t-display-md">
          {title}
        </h2>
        {lead ? <p>{lead}</p> : null}
      </div>
      {children}
    </div>
  );
}
