"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

type FilterOption = {
  label: string;
  value: string;
};

type CatalogFiltersProps = {
  fields: {
    name: string;
    label: string;
    options: FilterOption[];
  }[];
};

export function CatalogFilters({ fields }: CatalogFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function updateField(name: string, value: string) {
    const next = new URLSearchParams(searchParams.toString());

    if (value) {
      next.set(name, value);
    } else {
      next.delete(name);
    }

    next.delete("page");
    router.push(`${pathname}?${next.toString()}`);
  }

  return (
    <div className="card filter-bar">
      <div className="filter-grid">
        {fields.map((field) => (
          <label key={field.name} className="stack">
            <span>{field.label}</span>
            <select
              className="form-select"
              value={searchParams.get(field.name) ?? ""}
              onChange={(event) => updateField(field.name, event.target.value)}
            >
              <option value="">Все</option>
              {field.options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>
      <div className="btn-row">
        <button className="button-ghost" type="button" onClick={() => router.push(pathname)}>
          Сбросить фильтры
        </button>
      </div>
    </div>
  );
}
