"use client";

import { useCallback, type KeyboardEvent, type MouseEvent } from "react";

import { Photo } from "@/components/site/photo";

import styles from "./calculator.module.scss";
import { useFocusVisible } from "./focus-visible";

type OptionCardProps = {
  /** Общее имя группы радиокнопок. */
  name: string;
  checked: boolean;
  onSelect: () => void;
  /**
   * Повторный клик и Space/Enter снимают выбор.
   * Для обязательной толщины кромки не передаём: выбранную карточку нельзя выключить.
   */
  onDeselect?: () => void;
  /** Серая карточка: не нажимается. */
  disabled?: boolean;
  title: string;
  /** Вторая строка: размер, высота и т. п. */
  meta?: string;
  /** Пометка недоступности, например «нет у этого камня». */
  hint?: string;
  /** Готовая строка с ценой (форматирует вызывающий; цена — из БД). */
  price?: string;
  image?: string;
};

/**
 * Карточка выбора (радиокнопка с картинкой) для кромки, бортика и мойки.
 * Нативный `input[type=radio]` даёт клавиатуру (стрелки), фокус и озвучку.
 * Повторный выбор снимается через `onClick`: у radio браузер сам выбор не снимает.
 */
export function OptionCard({
  name,
  checked,
  onSelect,
  onDeselect,
  disabled = false,
  title,
  meta,
  hint,
  price,
  image
}: OptionCardProps) {
  const focus = useFocusVisible();

  const deselect = Boolean(onDeselect) && checked && !disabled;

  const handleClick = useCallback(
    (event: MouseEvent<HTMLInputElement>) => {
      if (!deselect || !onDeselect) return;
      event.preventDefault();
      onDeselect();
    },
    [deselect, onDeselect]
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (disabled) return;
      if (event.key !== " " && event.key !== "Enter") return;
      if (deselect && onDeselect) {
        event.preventDefault();
        onDeselect();
        return;
      }
      // Enter у radio сам карточку не включает — Space по-прежнему делает браузер.
      if (!checked && event.key === "Enter") {
        event.preventDefault();
        onSelect();
      }
    },
    [checked, deselect, disabled, onDeselect, onSelect]
  );

  return (
    <label
      className={styles.optionCard}
      data-selected={checked ? "true" : undefined}
      data-disabled={disabled ? "true" : undefined}
      data-focus-visible={focus.attr}
      aria-disabled={disabled ? true : undefined}
    >
      <input
        type="radio"
        name={name}
        className="visually-hidden"
        checked={checked}
        disabled={disabled}
        onChange={() => {
          if (disabled) return;
          onSelect();
        }}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        {...focus.handlers}
      />
      <span className={styles.optionMedia}>
        {image ? <Photo src={image} alt={title} sizes="(max-width: 570px) 46vw, (max-width: 1000px) 22vw, 200px" /> : null}
        <span className={styles.check} aria-hidden="true" />
      </span>
      <span className={styles.optionTitle}>{title}</span>
      {meta ? <span className={styles.optionMeta}>{meta}</span> : null}
      {hint ? <span className={styles.optionMeta}>{hint}</span> : null}
      {price ? <span className={styles.materialPrice}>{price}</span> : null}
    </label>
  );
}
