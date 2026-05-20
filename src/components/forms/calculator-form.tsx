"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { estimatePrice } from "@/lib/calc/calculator";
import { formatPrice } from "@/lib/utils";

export function CalculatorForm() {
  const [length, setLength] = useState(2400);
  const [width, setWidth] = useState(600);
  const material: "quartz" = "quartz";
  const [thickness, setThickness] = useState<"12" | "20" | "30">("20");

  const price = useMemo(
    () => estimatePrice({ length, width, material, thickness }),
    [length, material, thickness, width]
  );

  const query = new URLSearchParams({
    message: `Расчет с калькулятора: ${length}x${width} мм, материал ${material}, толщина ${thickness} мм`
  }).toString();

  return (
    <div className="grid grid-2">
      <form className="stack">
        <div className="form-grid">
          <label className="stack">
            <span>Длина, мм</span>
            <input
              className="field"
              min={500}
              step={100}
              type="number"
              value={length}
              onChange={(event) => {
                const next = Number(event.target.value);
                // Пустой input даёт NaN; без проверки estimatePrice/formatPrice получают NaN и портят UI.
                setLength(Number.isFinite(next) ? next : length);
              }}
            />
          </label>
          <label className="stack">
            <span>Ширина, мм</span>
            <input
              className="field"
              min={300}
              step={50}
              type="number"
              value={width}
              onChange={(event) => {
                const next = Number(event.target.value);
                setWidth(Number.isFinite(next) ? next : width);
              }}
            />
          </label>
          <label className="stack">
            <span>Материал</span>
            <input className="field" readOnly value="Кварцевый агломерат" />
          </label>
          <label className="stack">
            <span>Толщина</span>
            <select
              className="select"
              value={thickness}
              onChange={(event) => setThickness(event.target.value as "12" | "20" | "30")}
            >
              <option value="12">12 мм</option>
              <option value="20">20 мм</option>
              <option value="30">30 мм</option>
            </select>
          </label>
        </div>
      </form>

      <div className="price-box">
        <span>Примерная стоимость</span>
        <strong style={{ fontSize: "clamp(2rem, 5vw, 3.4rem)" }}>{formatPrice(price)} руб.</strong>
        <p style={{ color: "rgba(255,255,255,0.8)" }}>
          Итог зависит от профиля кромки, логистики и сложности монтажа; вырезы и фурнитура уточняются при замере.
        </p>
        <div className="btn-row">
          <Link className="button-secondary" href={`/contacts?${query}`}>
            Оформить заявку
          </Link>
          <Link className="button-ghost" href="/catalog">
            Смотреть каталог
          </Link>
        </div>
      </div>
    </div>
  );
}
