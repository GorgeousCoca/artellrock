import { facts } from "@/content/artellrock";

export function FactStrip() {
  return (
    <dl className="facts" aria-label="Коротко о мастерской">
      {facts.map((fact) => (
        <div key={fact.value}>
          <dt>{fact.value}</dt>
          <dd>{fact.label}</dd>
        </div>
      ))}
    </dl>
  );
}
