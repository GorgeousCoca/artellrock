"use client";

/**
 * Шаг 4 «Мойка»: тип установки, а для типов с несколькими записями (модели каменных моек) — ещё и модель.
 * Если у типа одна запись (обычный вырез), она выбирается сразу при выборе типа.
 */
import { useId } from "react";

import { formatRub } from "@/lib/calculator/format";
import { SINK_NONE_IMAGE, SINK_TYPES, SINK_TYPE_IMAGES } from "@/lib/calculator/taxonomy";

import { useCalculator } from "./calculator-context";
import styles from "./calculator.module.scss";
import { OptionCard } from "./option-card";

/** 0 ₽ на карточке — «Бесплатно» (входит в стоимость), как у кромок. */
const piecePrice = (price: number) => (price === 0 ? "Бесплатно" : formatRub(price));

export function SinkStep() {
  const { state, dispatch, catalog } = useCalculator();
  const groupId = useId();

  const groups = SINK_TYPES.map((type) => ({
    type,
    sinks: catalog.sinks.filter((sink) => sink.type === type.value)
  })).filter((group) => group.sinks.length > 0);

  const selected = groups.find((group) => group.type.value === state.sinkType);
  const needsModel = Boolean(selected && selected.sinks.length > 1);

  return (
    <section className={styles.step} aria-labelledby={`${groupId}-title`}>
      <h2 id={`${groupId}-title`} className="t-tagline">
        Мойка
      </h2>

      {groups.length === 0 ? (
        <p className={styles.notice}>Варианты установки мойки пока не добавлены. Пропустите шаг — детали обсудим на замере.</p>
      ) : (
        <>
          <fieldset className={styles.optionGroup}>
            <legend className="t-body-strong">Тип установки мойки</legend>
            <div className={styles.optionGrid}>
              <OptionCard
                name={`${groupId}-type`}
                checked={state.sinkType === null}
                onSelect={() => dispatch({ type: "sink/type", sinkType: null, onlySinkId: null })}
                title="Без выреза"
                image={SINK_NONE_IMAGE}
              />
              {groups.map(({ type, sinks }) => (
                <OptionCard
                  key={type.value}
                  name={`${groupId}-type`}
                  checked={state.sinkType === type.value}
                  onSelect={() =>
                    dispatch({ type: "sink/type", sinkType: type.value, onlySinkId: sinks.length === 1 ? sinks[0].id : null })
                  }
                  onDeselect={() => dispatch({ type: "sink/type", sinkType: null, onlySinkId: null })}
                  title={sinks.length === 1 ? sinks[0].name : type.label}
                  meta={sinks.length > 1 ? `${sinks.length} моделей` : undefined}
                  price={sinks.length === 1 ? piecePrice(sinks[0].price) : undefined}
                  image={SINK_TYPE_IMAGES[type.value]}
                />
              ))}
            </div>
          </fieldset>

          {needsModel && selected ? (
            <fieldset className={styles.optionGroup}>
              <legend className="t-body-strong">Модель</legend>
              <div className={styles.optionGrid}>
                {selected.sinks.map((sink) => (
                  <OptionCard
                    key={sink.id}
                    name={`${groupId}-model`}
                    checked={state.sinkId === sink.id}
                    onSelect={() => dispatch({ type: "sink/model", id: sink.id })}
                    onDeselect={() => dispatch({ type: "sink/model", id: null })}
                    title={sink.name}
                    meta={sink.description}
                    price={piecePrice(sink.price)}
                    image={sink.image}
                  />
                ))}
              </div>
            </fieldset>
          ) : null}
        </>
      )}
    </section>
  );
}
