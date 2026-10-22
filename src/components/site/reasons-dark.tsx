import { Brain, Clock, HardHat, Heart, Shield, ThumbsUp, type LucideIcon } from "lucide-react";

import { reasons } from "@/content/artellrock";

const reasonIcons: Record<(typeof reasons.items)[number]["title"], LucideIcon> = {
  "Всё под ключ": ThumbsUp,
  "Надёжность и безопасность": Shield,
  "Точно в срок": Clock,
  "Делаем своими руками": HardHat,
  "Продумываем заранее": Brain,
  "Слышим вас": Heart
};

/**
 * Тёмный блок «Почему ArtellRock» на мраморном фоне: шесть причин с иконками.
 * Один и тот же блок стоит в каталоге кварца и на странице «О компании».
 * Стили: `.quartz-reasons` в globals.scss.
 */
export function ReasonsDark({ id = "reasons-dark-title" }: { id?: string }) {
  return (
    <section className="quartz-reasons" aria-labelledby={id}>
      <h2 id={id}>{reasons.title}</h2>
      <ul>
        {reasons.items.map((item) => {
          const Icon = reasonIcons[item.title];
          return (
            <li key={item.title}>
              <span className="quartz-reasons__icon" aria-hidden="true">
                <Icon size={22} strokeWidth={1.75} />
              </span>
              <div>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
