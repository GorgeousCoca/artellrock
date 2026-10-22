import type { LegalBlock } from "@/content/legal";

export function LegalDocument({ blocks }: { blocks: readonly LegalBlock[] }) {
  return (
    <>
      {blocks.map((block, index) => {
        const key = `${block.kind}-${index}`;
        if (block.kind === "h2") {
          return (
            <h2 key={key} id={block.id}>
              {block.text}
            </h2>
          );
        }
        if (block.kind === "h3") return <h3 key={key}>{block.text}</h3>;
        if (block.kind === "list") {
          return (
            <ul key={key}>
              {block.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          );
        }
        return <p key={key}>{block.text}</p>;
      })}
    </>
  );
}
