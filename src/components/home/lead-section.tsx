import { leadForm } from "@/content/artellrock";
import { LeadForm } from "@/components/site/lead-form";

/** Блок 4: текст и доводы слева, поля справа. Якорь #zayavka — цель кнопок «Обсудить замер» и «Заявка». */
export function LeadSection({ source = "lead" }: { source?: string }) {
  return (
    <section id="zayavka" className="page lead" aria-labelledby="lead-title">
      <div>
        <h2 id="lead-title" className="t-display-lg">
          {leadForm.title}
        </h2>
        <p>{leadForm.lead}</p>
        <ul className="proofs">
          {leadForm.proofs.map((proof) => (
            <li key={proof}>{proof}</li>
          ))}
        </ul>
      </div>
      <LeadForm source={source} idPrefix="lead" />
    </section>
  );
}
