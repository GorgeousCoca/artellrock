import { Calculator, PenLine, Phone } from "lucide-react";
import Link from "next/link";

import { OrderCallButton } from "@/components/site/callback-dialog";

const options = [
  {
    title: "Калькулятор (кварц)",
    text: "Расчёт изделия из кварцевого агломерата по декору, размерам и кромке. Это предварительная сумма. Точную смету фиксируем после бесплатного замера.",
    href: "/kalkulyator",
    action: "Рассчитать",
    icon: Calculator
  },
  {
    title: "Заказать звонок",
    text: "Оставьте телефон. Перезвоним и договоримся о бесплатном замере по Санкт-Петербургу и Ленинградской области.",
    href: "#zayavka",
    action: "Заказать",
    callback: true,
    variant: "call",
    source: "Заказ звонка",
    idPrefix: "zvonok",
    icon: Phone
  },
  {
    title: "Чертёж изделия",
    text: "Приложите эскиз в jpg, png, gif, doc или xls. Перезвоним и назовём предварительную стоимость. Точную смету фиксируем после бесплатного замера.",
    href: "/stoimost",
    action: "Загрузить",
    callback: true,
    variant: "drawing",
    source: "Загрузка чертежа",
    idPrefix: "chertezh",
    icon: PenLine
  }
] as const;

/** Три способа узнать стоимость. Акрилового калькулятора нет. */
export function CostCatalog() {
  return (
    <div className="cost-grid">
      {options.map((option) => {
        const Icon = option.icon;

        return (
          <article key={option.title} className="cost-option">
            <Icon className="cost-option__icon" size={40} strokeWidth={1.6} aria-hidden="true" />
            <h2 className="cost-option__title">{option.title}</h2>
            <p>{option.text}</p>
            {"callback" in option ? (
              <OrderCallButton
                className="btn btn--primary"
                label={option.action}
                source={option.source}
                idPrefix={option.idPrefix}
                variant={option.variant}
              />
            ) : (
              <Link className="btn btn--primary" href={option.href}>
                {option.action}
              </Link>
            )}
          </article>
        );
      })}
    </div>
  );
}
