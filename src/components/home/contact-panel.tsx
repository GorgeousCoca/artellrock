import { PHONE, PHONE_HREF, VK_URL, contactPanel } from "@/content/artellrock";
import { LeadForm } from "@/components/site/lead-form";

/** Блок связи: бежевая панель, кремовая форма, золотая кнопка звонка. */
export function ContactPanel() {
  return (
    <section className="page block contact-panel" aria-labelledby="panel-title">
      <div className="contact-panel__copy">
        <span className="eyebrow eyebrow--sand">{contactPanel.eyebrow}</span>
        <h2 id="panel-title" className="t-display-lg">
          {contactPanel.title}
        </h2>
        <p>{contactPanel.lead}</p>
        <div className="contact-panel__actions">
          <a className="btn btn--primary" href={PHONE_HREF}>
            {PHONE}
          </a>
          <a className="text-link" href={VK_URL} target="_blank" rel="noreferrer noopener">
            {contactPanel.vkLink}
          </a>
        </div>
      </div>
      <div className="contact-panel__form">
        <LeadForm source="contact-panel" idPrefix="panel" />
      </div>
    </section>
  );
}
