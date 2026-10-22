"use client";

/**
 * Состояние «фокус с клавиатуры» для обёрток нативных input (радиокнопки и чекбоксы внутри <label>).
 *
 * Раньше кольцо фокуса рисовалось селектором `:has(input:focus-visible)`, а в старых браузерах `:has()` нет,
 * и фокус на карточке или форме пропадал совсем. Теперь React выставляет `data-focus-visible` на обёртку,
 * а стили смотрят на этот атрибут: в современных браузерах результат тот же, в старых — кольцо остаётся.
 */
import { useState, type FocusEvent } from "react";

/** Фокус пришёл с клавиатуры (а не от мышиного клика). В браузерах без `:focus-visible` считаем, что с клавиатуры. */
export function isFocusVisible(element: Element): boolean {
  try {
    return element.matches(":focus-visible");
  } catch {
    return true;
  }
}

/** Для одной обёртки: `data-focus-visible` на label, `handlers` на input. */
export function useFocusVisible() {
  const [visible, setVisible] = useState(false);
  return {
    attr: visible ? ("true" as const) : undefined,
    handlers: {
      onFocus: (event: FocusEvent<HTMLInputElement>) => setVisible(isFocusVisible(event.currentTarget)),
      onBlur: () => setVisible(false)
    }
  };
}

/** Для списка обёрток (одновременно в фокусе не больше одной): состояние хранится по ключу. */
export function useFocusVisibleKey() {
  const [focused, setFocused] = useState<string | null>(null);
  return {
    attr: (key: string) => (focused === key ? ("true" as const) : undefined),
    handlers: (key: string) => ({
      onFocus: (event: FocusEvent<HTMLInputElement>) => setFocused(isFocusVisible(event.currentTarget) ? key : null),
      onBlur: () => setFocused((current) => (current === key ? null : current))
    })
  };
}
