"use client";

/**
 * Мастер расчёта из 6 шагов: вкладки, текущий шаг и нижняя панель с живой суммой.
 *
 * Навигация свободная: на любой шаг можно перейти вкладкой. Незаполненное обязательное (материал, толщина
 * кромки, модель мойки, размеры) подсвечивается подсказкой, а смета и отправка заявки на шаге «Результат»
 * откроются, только когда всё заполнено. Профиль и бортик необязательны: нет выбора — нет строки в смете.
 */
import { useEffect, useRef } from "react";

import { formatRub } from "@/lib/calculator/format";
import type { CalculatorCatalog } from "@/lib/calculator/types";

import { CalculatorProvider, LAST_STEP, STEPS, useCalculator } from "./calculator-context";
import styles from "./calculator.module.scss";
import { EdgeStep } from "./edge-step";
import { EstimateStep } from "./estimate-step";
import { MaterialSelector } from "./material-selector";
import { ServicesStep } from "./services-step";
import { ShapeDrawing } from "./shape-drawing";
import { SinkStep } from "./sink-step";

const STEP_VIEWS = [ShapeDrawing, MaterialSelector, EdgeStep, SinkStep, ServicesStep, EstimateStep] as const;

function Wizard() {
  const { state, dispatch, blockReason, live, geometryValid } = useCalculator();
  const panelRef = useRef<HTMLDivElement>(null);
  const firstRender = useRef(true);

  /** Подсказка, чего не хватает на текущем шаге. Навигацию не блокирует: ограничение стоит только на отправке заявки. */
  const reason = state.step < LAST_STEP ? blockReason(state.step) : null;

  // При смене шага переводим фокус на панель: читалки экрана озвучивают новый шаг, клавиатура не теряется.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    panelRef.current?.focus({ preventScroll: true });
    panelRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
  }, [state.step]);

  const StepView = STEP_VIEWS[state.step];
  const total = geometryValid && live.estimate ? live.estimate.total : null;

  return (
    <div className={styles.wizard}>
      <nav aria-label="Шаги расчёта">
        <ol className={styles.stepper}>
          {STEPS.map((title, index) => {
            return (
              <li key={title}>
                <button
                  type="button"
                  className={styles.stepTab}
                  aria-current={index === state.step ? "step" : undefined}
                  data-done={index < state.step ? "true" : undefined}
                  onClick={() => dispatch({ type: "go", step: index })}
                >
                  <span className={styles.stepNumber}>{index + 1}</span>
                  {title}
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      <div ref={panelRef} className={styles.panel} tabIndex={-1}>
        <StepView />
      </div>

      <div className={styles.bar}>
        <div className={styles.barTotal}>
          <span>Предварительная стоимость</span>
          <strong aria-live="polite" aria-busy={live.status === "loading"}>
            {total !== null ? formatRub(total) : "—"}
          </strong>
          {total !== null && !state.material ? <small>без материала — выберите его на шаге 2</small> : null}
          {live.status === "loading" ? <small>считаем…</small> : null}
          {live.status === "error" && state.step !== LAST_STEP ? <small role="alert">{live.error}</small> : null}
        </div>

        <div className={styles.barActions}>
          <button
            type="button"
            className="btn btn--secondary"
            disabled={state.step === 0}
            onClick={() => dispatch({ type: "go", step: state.step - 1 })}
          >
            Назад
          </button>
          {state.step < LAST_STEP ? (
            <button
              type="button"
              className="btn btn--primary"
              onClick={() => dispatch({ type: "go", step: state.step + 1 })}
            >
              {state.step === LAST_STEP - 1 ? "К результату" : "Далее"}
            </button>
          ) : null}
        </div>

        {reason ? (
          <p className={styles.barReason} role="status">
            {reason}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export function CalculatorWizard({ catalog }: { catalog: CalculatorCatalog }) {
  return (
    <CalculatorProvider catalog={catalog}>
      <Wizard />
    </CalculatorProvider>
  );
}
