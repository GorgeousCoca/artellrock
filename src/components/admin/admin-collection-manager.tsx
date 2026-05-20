"use client";

import { useMemo, useState } from "react";

import type { AdminCollectionKey, AdminField } from "@/lib/admin/config";

type ItemRecord = Record<string, unknown> & { id: string };

type AdminCollectionManagerProps = {
  collection: AdminCollectionKey;
  title: string;
  description: string;
  fields: AdminField[];
  initialItems: ItemRecord[];
};

function stringifyValue(value: unknown) {
  if (Array.isArray(value)) {
    return value.join(", ");
  }

  if (typeof value === "boolean") {
    return value;
  }

  return String(value ?? "");
}

function parseValue(type: AdminField["type"], value: FormDataEntryValue | null, checked?: boolean) {
  if (type === "checkbox") {
    return Boolean(checked);
  }

  const stringValue = String(value ?? "");

  if (type === "number") {
    return Number(stringValue || 0);
  }

  if (stringValue.includes(",") || stringValue.includes("\n")) {
    const normalized = stringValue
      .split(/,|\n/)
      .map((item) => item.trim())
      .filter(Boolean);

    if (normalized.length > 1) {
      return normalized;
    }
  }

  return stringValue;
}

export function AdminCollectionManager({
  collection,
  title,
  description,
  fields,
  initialItems
}: AdminCollectionManagerProps) {
  const [items, setItems] = useState(initialItems);
  const [editingId, setEditingId] = useState<string | null>(null);
  const editingItem = useMemo(() => items.find((item) => item.id === editingId) ?? null, [editingId, items]);

  async function handleSubmit(formData: FormData) {
    const payload = Object.fromEntries(
      fields.map((field) => [
        field.name,
        parseValue(field.type, formData.get(field.name), formData.get(field.name) === "on")
      ])
    );

    try {
      // Сбой сети или 5xx — fetch кидает/возвращает не-JSON; без try/catch возможны необработанные отклонения и SyntaxError.
      const response = await fetch(
        editingId ? `/api/admin/${collection}/${editingId}` : `/api/admin/${collection}`,
        {
          method: editingId ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
        }
      );

      if (!response.ok) {
        return;
      }

      const nextItem = (await response.json()) as ItemRecord;

      setItems((current) =>
        editingId ? current.map((item) => (item.id === editingId ? nextItem : item)) : [nextItem, ...current]
      );
      setEditingId(null);
    } catch {
      // Тихий выход: форма остаётся в прежнем состоянии; при необходимости сюда можно добавить toast.
    }
  }

  async function handleDelete(id: string) {
    try {
      const response = await fetch(`/api/admin/${collection}/${id}`, { method: "DELETE" });

      if (!response.ok) {
        return;
      }

      setItems((current) => current.filter((item) => item.id !== id));
      if (editingId === id) {
        setEditingId(null);
      }
    } catch {
      // Удаление не должно ронять консоль при обрыве сети.
    }
  }

  return (
    <div className="admin-grid">
      <div className="admin-toolbar">
        <div className="stack" style={{ gap: 6 }}>
          <h1>{title}</h1>
          <p className="muted">{description}</p>
        </div>
        <button className="button" type="button" onClick={() => setEditingId(null)}>
          Создать запись
        </button>
      </div>

      <div className="grid grid-2">
        <form
          className="card stack"
          action={async (formData) => {
            await handleSubmit(formData);
          }}
        >
          <h2>{editingItem ? "Редактирование" : "Новая запись"}</h2>
          {fields.map((field) => {
            const defaultValue = editingItem ? stringifyValue(editingItem[field.name]) : "";

            if (field.type === "textarea") {
              return (
                <label key={field.name} className="stack">
                  <span>{field.label}</span>
                  <textarea className="textarea" defaultValue={String(defaultValue)} name={field.name} />
                </label>
              );
            }

            if (field.type === "checkbox") {
              return (
                <label key={field.name} className="pill">
                  <input
                    defaultChecked={Boolean(editingItem?.[field.name])}
                    name={field.name}
                    type="checkbox"
                  />
                  &nbsp;{field.label}
                </label>
              );
            }

            return (
              <label key={field.name} className="stack">
                <span>{field.label}</span>
                <input
                  className="field"
                  defaultValue={String(defaultValue)}
                  name={field.name}
                  type={field.type === "number" ? "number" : "text"}
                />
              </label>
            );
          })}
          <div className="btn-row">
            <button className="button" type="submit">
              {editingItem ? "Сохранить" : "Создать"}
            </button>
            {editingItem ? (
              <button className="button-secondary" type="button" onClick={() => setEditingId(null)}>
                Отменить
              </button>
            ) : null}
          </div>
        </form>

        <div className="stack">
          {items.map((item) => (
            <article key={item.id} className="card stack">
              <div className="admin-toolbar">
                <div className="stack" style={{ gap: 4 }}>
                  <strong>{String(item.title ?? item.name ?? item.author ?? item.slug ?? item.id)}</strong>
                  <span className="muted">
                    {String(item.slug ?? item.role ?? item.category ?? item.fileUrl ?? item.id)}
                  </span>
                </div>
                <div className="btn-row">
                  <button className="button-secondary" type="button" onClick={() => setEditingId(item.id)}>
                    Изменить
                  </button>
                  <button className="button-ghost" type="button" onClick={() => handleDelete(item.id)}>
                    Удалить
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
