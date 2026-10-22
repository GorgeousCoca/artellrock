"use client";

/**
 * Состояние калькулятора: единственный источник правды для всех шагов.
 *
 * Здесь же — «двусторонняя синхронизация» чертежа и формы: поля ввода и точки на SVG пишут в один и тот же
 * редьюсер (`item/dim`), а чертёж всегда рисуется из состояния. Отдельной копии размеров в SVG нет.
 *
 * Клиент хранит только выборы (идентификаторы и геометрию). Стоимость приходит с сервера: `live.estimate`
 * обновляется Server Action'ом `calculateEstimateAction` после небольшой паузы в изменениях.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type Dispatch,
  type ReactNode
} from "react";

import { calculateEstimateAction } from "@/lib/calculator/actions";
import type { Estimate } from "@/lib/calculator/estimate";
import { isThicknessAvailable, THICKNESS_RESET_MESSAGE } from "@/lib/calculator/thickness-availability";
import {
  cornerIds,
  DEFAULT_CORNER_RADIUS_MM,
  defaultDimensions,
  pruneCorners,
  sideIds,
  validateItem,
  type Dimensions,
  type ShapeKind
} from "@/lib/calculator/geometry";
import type { CalculatorInput } from "@/lib/calculator/schema";
import type { SinkType } from "@/lib/calculator/taxonomy";
import type { CalculatorCatalog, MaterialCard } from "@/lib/calculator/types";

export type CalcItem = CalculatorInput["items"][number];
export type SideRole = "edge" | "backsplash" | "none";

export const STEPS = ["Размер", "Материал", "Кромка и бортик", "Мойка", "Доп. работы", "Результат"] as const;
export const LAST_STEP = STEPS.length - 1;

export type CalcState = {
  step: number;
  /** Дальше этого шага пользователь уже заходил (шаги до него доступны по вкладкам). */
  reached: number;
  items: CalcItem[];
  activeId: string;
  /** Счётчик для детерминированных id изделий (без random: иначе рассинхрон гидратации). */
  counter: number;
  material: MaterialCard | null;
  thicknessId: string | null;
  /** Почему сбросили толщину при смене камня. Пусто, когда подсказка не нужна. */
  thicknessNotice: string | null;
  profileId: string | null;
  backsplashId: string | null;
  sinkType: SinkType | null;
  sinkId: string | null;
  /** serviceId -> количество (имеет значение только для услуг с количеством от клиента). */
  services: Record<string, number>;
};

export type CalcAction =
  | { type: "go"; step: number }
  | { type: "item/add" }
  | { type: "item/clone"; id: string }
  | { type: "item/remove"; id: string }
  | { type: "item/select"; id: string }
  | { type: "item/shape"; id: string; shape: ShapeKind }
  | { type: "item/dim"; id: string; key: string; value: number }
  | { type: "item/radius"; id: string; value: number }
  | { type: "item/corner"; id: string; corner: string }
  | { type: "item/side"; id: string; side: string; role: SideRole }
  | { type: "material/select"; material: MaterialCard; clearThickness?: boolean }
  | { type: "thickness/select"; id: string | null }
  | { type: "profile/select"; id: string | null }
  | { type: "backsplash/select"; id: string | null }
  | { type: "sink/type"; sinkType: SinkType | null; onlySinkId: string | null }
  | { type: "sink/model"; id: string | null }
  | { type: "service/toggle"; id: string }
  | { type: "service/quantity"; id: string; value: number };

function makeItem(n: number, shape: ShapeKind = "straight"): CalcItem {
  return {
    id: `item-${n}`,
    shape,
    dims: defaultDimensions(shape),
    // Радиус показывается в поле «R», но скругляются только отмеченные углы: по умолчанию их нет.
    cornerRadius: DEFAULT_CORNER_RADIUS_MM,
    roundedCorners: [],
    // По умолчанию обработаны все стороны; пользователь убирает те, что у стены, или ставит там бортик.
    edgeSides: sideIds(shape),
    backsplashSides: []
  };
}

export function initialState(): CalcState {
  return {
    step: 0,
    reached: 0,
    items: [makeItem(1)],
    activeId: "item-1",
    counter: 1,
    material: null,
    thicknessId: null,
    thicknessNotice: null,
    profileId: null,
    backsplashId: null,
    sinkType: null,
    sinkId: null,
    services: {}
  };
}

function mapItem(state: CalcState, id: string, fn: (item: CalcItem) => CalcItem): CalcState {
  return { ...state, items: state.items.map((item) => (item.id === id ? fn(item) : item)) };
}

function reducer(state: CalcState, action: CalcAction): CalcState {
  switch (action.type) {
    case "go": {
      const step = Math.min(LAST_STEP, Math.max(0, action.step));
      return { ...state, step, reached: Math.max(state.reached, step) };
    }

    case "item/add": {
      const counter = state.counter + 1;
      const item = makeItem(counter);
      return { ...state, counter, items: [...state.items, item], activeId: item.id };
    }

    case "item/clone": {
      const source = state.items.find((i) => i.id === action.id);
      if (!source) return state;
      const counter = state.counter + 1;
      const copy: CalcItem = {
        ...source,
        id: `item-${counter}`,
        dims: { ...source.dims },
        roundedCorners: [...source.roundedCorners],
        edgeSides: [...source.edgeSides],
        backsplashSides: [...source.backsplashSides]
      };
      const at = state.items.findIndex((i) => i.id === action.id);
      const items = [...state.items.slice(0, at + 1), copy, ...state.items.slice(at + 1)];
      return { ...state, counter, items, activeId: copy.id };
    }

    case "item/remove": {
      if (state.items.length <= 1) return state;
      const at = state.items.findIndex((i) => i.id === action.id);
      const items = state.items.filter((i) => i.id !== action.id);
      const activeId = state.activeId === action.id ? items[Math.min(at, items.length - 1)].id : state.activeId;
      return { ...state, items, activeId };
    }

    case "item/select":
      return state.items.some((i) => i.id === action.id) ? { ...state, activeId: action.id } : state;

    case "item/shape":
      // Идентификаторы углов у разных форм совпадают по виду (`c2`), но это разные углы: выбор сбрасывается.
      // Радиус — личная настройка пользователя, его сохраняем.
      return mapItem(state, action.id, (item) => ({
        ...makeItem(0, action.shape),
        id: item.id,
        cornerRadius: item.cornerRadius
      }));

    case "item/dim":
      // Идентификаторы углов не зависят от размеров, поэтому выбор сохраняется; чистим лишь то, чего нет у формы.
      return mapItem(state, action.id, (item) => ({
        ...item,
        dims: { ...item.dims, [action.key]: action.value },
        roundedCorners: pruneCorners(item.shape, item.roundedCorners)
      }));

    case "item/radius":
      return mapItem(state, action.id, (item) => ({ ...item, cornerRadius: action.value }));

    case "item/corner":
      return mapItem(state, action.id, (item) => {
        if (!cornerIds(item.shape).includes(action.corner)) return item;
        const roundedCorners = item.roundedCorners.includes(action.corner)
          ? item.roundedCorners.filter((corner) => corner !== action.corner)
          : [...item.roundedCorners, action.corner];
        return { ...item, roundedCorners };
      });

    case "item/side":
      return mapItem(state, action.id, (item) => {
        const edgeSides = item.edgeSides.filter((s) => s !== action.side);
        const backsplashSides = item.backsplashSides.filter((s) => s !== action.side);
        if (action.role === "edge") edgeSides.push(action.side);
        if (action.role === "backsplash") backsplashSides.push(action.side);
        return { ...item, edgeSides, backsplashSides };
      });

    case "material/select":
      if (action.clearThickness) {
        return {
          ...state,
          material: action.material,
          thicknessId: null,
          thicknessNotice: THICKNESS_RESET_MESSAGE
        };
      }
      return { ...state, material: action.material, thicknessNotice: null };

    case "thickness/select":
      return { ...state, thicknessId: action.id, thicknessNotice: action.id ? null : state.thicknessNotice };

    case "profile/select":
      return { ...state, profileId: action.id };

    case "backsplash/select":
      return { ...state, backsplashId: action.id };

    case "sink/type":
      // Если у типа одна запись (обычный вырез), она выбирается сразу; иначе нужно выбрать модель.
      return { ...state, sinkType: action.sinkType, sinkId: action.onlySinkId };

    case "sink/model":
      return { ...state, sinkId: action.id };

    case "service/toggle": {
      const services = { ...state.services };
      if (action.id in services) delete services[action.id];
      else services[action.id] = 1;
      return { ...state, services };
    }

    case "service/quantity":
      return { ...state, services: { ...state.services, [action.id]: action.value } };
  }
}

/** Состояние -> вход серверного расчёта. Только идентификаторы и геометрия: ни цен, ни названий. */
export function toInput(state: CalcState): CalculatorInput {
  return {
    items: state.items.map((item) => ({
      id: item.id,
      shape: item.shape,
      dims: item.dims,
      cornerRadius: item.cornerRadius,
      roundedCorners: item.roundedCorners,
      edgeSides: item.edgeSides,
      backsplashSides: item.backsplashSides
    })),
    ...(state.material ? { materialId: state.material.id } : {}),
    ...(state.thicknessId ? { thicknessId: state.thicknessId } : {}),
    ...(state.profileId ? { profileId: state.profileId } : {}),
    ...(state.backsplashId ? { backsplashId: state.backsplashId } : {}),
    ...(state.sinkId ? { sinkId: state.sinkId } : {}),
    services: Object.entries(state.services).map(([serviceId, quantity]) => ({ serviceId, quantity }))
  };
}

export type LiveEstimate = {
  status: "idle" | "loading" | "ready" | "error";
  estimate: Estimate | null;
  error: string | null;
};

type CalculatorContextValue = {
  state: CalcState;
  dispatch: Dispatch<CalcAction>;
  catalog: CalculatorCatalog;
  input: CalculatorInput;
  /** Ошибки по изделиям (пусто — изделие корректно). */
  itemErrors: Record<string, Record<string, string>>;
  geometryValid: boolean;
  /** Шаг, на котором работа заблокирована (или null). Дальше него пройти нельзя. */
  blockedStep: number | null;
  /** Причина, по которой нельзя перейти дальше с шага `step`. */
  blockReason: (step: number) => string | null;
  live: LiveEstimate;
  /** Пересчитать на сервере немедленно (без паузы). */
  refresh: () => Promise<void>;
};

const CalculatorContext = createContext<CalculatorContextValue | null>(null);

const LIVE_DEBOUNCE_MS = 400;

export function CalculatorProvider({ catalog, children }: { catalog: CalculatorCatalog; children: ReactNode }) {
  const [state, rawDispatch] = useReducer(reducer, undefined, initialState);

  // material-selector шлёт обычный material/select. Здесь решаем, жива ли выбранная толщина для нового камня.
  const dispatch = useCallback<Dispatch<CalcAction>>(
    (action) => {
      if (action.type === "material/select" && !action.clearThickness && state.thicknessId) {
        const edge = catalog.edges.find((item) => item.id === state.thicknessId && item.kind === "thickness");
        if (edge && !isThicknessAvailable(edge, action.material.thicknessesMm)) {
          rawDispatch({ ...action, clearThickness: true });
          return;
        }
      }
      rawDispatch(action);
    },
    [catalog.edges, state.thicknessId]
  );
  const [live, setLive] = useState<LiveEstimate>({ status: "idle", estimate: null, error: null });
  const requestId = useRef(0);

  const input = useMemo(() => toInput(state), [state]);
  const inputKey = JSON.stringify(input);

  const itemErrors = useMemo(
    () => Object.fromEntries(state.items.map((item) => [item.id, validateItem(item)])),
    [state.items]
  );
  const geometryValid = Object.values(itemErrors).every((errors) => Object.keys(errors).length === 0);

  const blockReason = useCallback(
    (step: number): string | null => {
      if (step === 0 && !geometryValid) return "Исправьте размеры, отмеченные красным.";
      if (step === 1 && !state.material) return "Выберите материал.";
      if (step === 2) {
        const thicknesses = catalog.edges.filter((edge) => edge.kind === "thickness");
        if (thicknesses.length > 0) {
          const stone = state.material?.thicknessesMm ?? [];
          const anyAvailable = thicknesses.some((edge) => isThicknessAvailable(edge, stone));
          if (!anyAvailable) return "Для этого камня нет доступной толщины кромки. Выберите другой материал.";
          if (!state.thicknessId) return "Выберите толщину кромки.";
        }
      }
      if (step === 3 && state.sinkType) {
        const models = catalog.sinks.filter((s) => s.type === state.sinkType);
        if (models.length > 1 && !state.sinkId) return "Выберите модель мойки.";
      }
      return null;
    },
    [catalog.edges, catalog.sinks, geometryValid, state.material, state.sinkId, state.sinkType, state.thicknessId]
  );

  const blockedStep = useMemo(() => {
    for (let step = 0; step <= LAST_STEP; step += 1) {
      if (blockReason(step)) return step;
    }
    return null;
  }, [blockReason]);

  const run = useCallback(async (payload: CalculatorInput) => {
    const id = (requestId.current += 1);
    setLive((prev) => ({ ...prev, status: "loading" }));

    try {
      const result = await calculateEstimateAction(payload);
      // Ответ устарел: пока считали, пользователь уже изменил выбор.
      if (id !== requestId.current) return;
      setLive(
        result.ok
          ? { status: "ready", estimate: result.estimate, error: null }
          : { status: "error", estimate: null, error: result.error }
      );
    } catch {
      if (id !== requestId.current) return;
      setLive({ status: "error", estimate: null, error: "Нет связи с сервером. Проверьте интернет и попробуйте ещё раз." });
    }
  }, []);

  // Живая сумма: сервер пересчитывает после паузы в правках, пока геометрия корректна.
  useEffect(() => {
    if (!geometryValid) return;
    const timer = setTimeout(() => void run(JSON.parse(inputKey) as CalculatorInput), LIVE_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [geometryValid, inputKey, run]);

  const refresh = useCallback(() => run(JSON.parse(inputKey) as CalculatorInput), [inputKey, run]);

  const value = useMemo<CalculatorContextValue>(
    () => ({ state, dispatch, catalog, input, itemErrors, geometryValid, blockedStep, blockReason, live, refresh }),
    [state, dispatch, catalog, input, itemErrors, geometryValid, blockedStep, blockReason, live, refresh]
  );

  return <CalculatorContext.Provider value={value}>{children}</CalculatorContext.Provider>;
}

export function useCalculator(): CalculatorContextValue {
  const ctx = useContext(CalculatorContext);
  if (!ctx) throw new Error("useCalculator must be used inside <CalculatorProvider>");
  return ctx;
}

export type { Dimensions };
