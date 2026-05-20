type JsonValue = Record<string, unknown>;

function schemaKey(schema: JsonValue, index: number) {
  const id = schema["@id"];
  if (typeof id === "string") return id;
  const typ = schema["@type"];
  if (typeof typ === "string") return `${String(typ)}-${index}`;
  return `jsonld-${index}`;
}

export function JsonLd({ data }: { data: JsonValue | JsonValue[] }) {
  const list = Array.isArray(data) ? data : [data];
  return (
    <>
      {list.map((schema, index) => (
        <script key={schemaKey(schema, index)} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      ))}
    </>
  );
}
