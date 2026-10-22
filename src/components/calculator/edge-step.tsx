"use client";

/**
 * Шаг 3 «Кромка и бортик».
 *
 * 1. На чертеже каждого изделия отмечаем стороны: кромка (обрабатывается профилем), бортик (у стены) или без обработки.
 *    От этого зависит длина в метрах погонных, по которой сервер считает толщину кромки, профиль и бортик.
 * 2. Выбираем толщину (обязательна), профиль и бортик из справочников (цены — из БД).
 *    Повторное нажатие снимает профиль и бортик. Толщину снять нельзя.
 *    Нет выбранного бортика — бортика в заказе нет, это не ошибка.
 */
import { useId } from "react";

import { formatQuantity, formatMm, formatRub } from "@/lib/calculator/format";
import { buildOutline, clampDimensions, measureItem, shapeLabel } from "@/lib/calculator/geometry";
import { isThicknessAvailable, THICKNESS_UNAVAILABLE_NOTE } from "@/lib/calculator/thickness-availability";

import { useCalculator, type CalcItem, type SideRole } from "./calculator-context";
import styles from "./calculator.module.scss";
import { OptionCard } from "./option-card";
import { ShapeCanvas, sideRole } from "./shape-canvas";

const ROLE_LABEL: Record<SideRole, string> = {
  edge: "Кромка",
  backsplash: "Бортик",
  none: "Без обработки"
};

const perMeter = (price: number) => (price === 0 ? "Бесплатно" : `${formatRub(price)} / м.п.`);

function SidePicker({ item, index }: { item: CalcItem; index: number }) {
  const { dispatch, catalog } = useCalculator();
  const outline = buildOutline(item.shape, clampDimensions(item.shape, item.dims), 0);
  const measure = measureItem(item);
  const hasBacksplashes = catalog.backsplashes.length > 0;
  const roles: SideRole[] = hasBacksplashes ? ["edge", "backsplash", "none"] : ["edge", "none"];

  return (
    <div className={styles.sidePicker}>
      <h3 className="t-body-strong">
        Изделие №{index + 1} <small>{shapeLabel(item.shape)}</small>
      </h3>
      <div className={styles.sidePickerBody}>
        <div className={styles.drawingSmall}>
          <ShapeCanvas
            item={item}
            mode="sides"
            onSideCycle={(side, next) =>
              // Если бортиков в справочнике нет, цикл пропускает этот вариант.
              dispatch({ type: "item/side", id: item.id, side, role: next === "backsplash" && !hasBacksplashes ? "none" : next })
            }
          />
        </div>
        <ul className={styles.sideList}>
          {outline.sides.map((side) => {
            const role = sideRole(item, side.id);
            return (
              <li key={side.id}>
                <span className={styles.sideNumber} data-role={role} aria-hidden="true">
                  {side.index}
                </span>
                <span className={styles.sideLength}>{formatMm(side.lengthMm)}</span>
                <select
                  aria-label={`Изделие ${index + 1}, сторона ${side.index}, ${formatMm(side.lengthMm)}`}
                  value={role}
                  onChange={(event) =>
                    dispatch({ type: "item/side", id: item.id, side: side.id, role: event.target.value as SideRole })
                  }
                >
                  {roles.map((value) => (
                    <option key={value} value={value}>
                      {ROLE_LABEL[value]}
                    </option>
                  ))}
                </select>
              </li>
            );
          })}
        </ul>
      </div>
      <p className={styles.sideTotals} aria-live="polite">
        Кромка: <strong>{formatQuantity(measure.edgeLengthMm / 1000)} м.п.</strong>
        {hasBacksplashes ? (
          <>
            {" · "}Бортик: <strong>{formatQuantity(measure.backsplashLengthMm / 1000)} м.п.</strong>
          </>
        ) : null}
      </p>
    </div>
  );
}

export function EdgeStep() {
  const { state, dispatch, catalog } = useCalculator();
  const groupId = useId();

  const thicknesses = catalog.edges.filter((edge) => edge.kind === "thickness");
  const profiles = catalog.edges.filter((edge) => edge.kind === "profile");
  // Нет камня или пустой список толщин — данные неизвестны, карточки не блокируем.
  const stoneThicknesses = state.material?.thicknessesMm ?? [];

  return (
    <section className={styles.step} aria-labelledby={`${groupId}-title`}>
      <h2 id={`${groupId}-title`} className="t-tagline">
        Кромка и бортик
      </h2>
      <p className={styles.stepLead}>
        Нажмите на сторону чертежа или выберите вариант в списке: кромка обрабатывается профилем, бортик ставится вдоль стены.
      </p>

      <div className={styles.sidePickers}>
        {state.items.map((item, index) => (
          <SidePicker key={item.id} item={item} index={index} />
        ))}
      </div>

      <div className={styles.legend} aria-hidden="true">
        <span data-role="edge">Кромка</span>
        {catalog.backsplashes.length > 0 ? <span data-role="backsplash">Бортик</span> : null}
        <span data-role="none">Без обработки</span>
      </div>

      {thicknesses.length > 0 ? (
        <fieldset className={styles.optionGroup}>
          <legend className="t-body-strong">Толщина кромки</legend>
          <p className={styles.thicknessNotice} role="status">
            {state.thicknessNotice ?? ""}
          </p>
          <div className={styles.optionGrid}>
            {thicknesses.map((edge) => {
              const available = isThicknessAvailable(edge, stoneThicknesses);
              return (
                <OptionCard
                  key={edge.id}
                  name={`${groupId}-thickness`}
                  checked={state.thicknessId === edge.id}
                  disabled={!available}
                  onSelect={() => dispatch({ type: "thickness/select", id: edge.id })}
                  title={edge.name}
                  hint={available ? undefined : THICKNESS_UNAVAILABLE_NOTE}
                  price={perMeter(edge.pricePerMeter)}
                  image={edge.image}
                />
              );
            })}
          </div>
        </fieldset>
      ) : null}

      {profiles.length > 0 ? (
        <fieldset className={styles.optionGroup}>
          <legend className="t-body-strong">Профиль кромки</legend>
          <div className={styles.optionGrid}>
            {profiles.map((edge) => (
              <OptionCard
                key={edge.id}
                name={`${groupId}-profile`}
                checked={state.profileId === edge.id}
                onSelect={() => dispatch({ type: "profile/select", id: edge.id })}
                onDeselect={() => dispatch({ type: "profile/select", id: null })}
                title={edge.name}
                price={perMeter(edge.pricePerMeter)}
                image={edge.image}
              />
            ))}
          </div>
        </fieldset>
      ) : null}

      {catalog.backsplashes.length > 0 ? (
        <fieldset className={styles.optionGroup}>
          <legend className="t-body-strong">Бортик</legend>
          <div className={styles.optionGrid}>
            {catalog.backsplashes.map((backsplash) => (
              <OptionCard
                key={backsplash.id}
                name={`${groupId}-backsplash`}
                checked={state.backsplashId === backsplash.id}
                onSelect={() => dispatch({ type: "backsplash/select", id: backsplash.id })}
                onDeselect={() => dispatch({ type: "backsplash/select", id: null })}
                title={backsplash.name}
                meta={backsplash.heightMm ? `высота ${backsplash.heightMm} мм` : undefined}
                price={perMeter(backsplash.pricePerMeter)}
                image={backsplash.image}
              />
            ))}
          </div>
        </fieldset>
      ) : null}
    </section>
  );
}
