import {
  Clock3,
  Hammer,
  Heart,
  Lightbulb,
  PackageCheck,
  ShieldCheck,
  type LucideIcon
} from "lucide-react";

import styles from "./home-reasons-strip.module.scss";

const reasons: { title: string; text: string; icon: LucideIcon }[] = [
  {
    title: "Всё включено",
    text:
      "Мы всё делаем по максимуму и осуществляем работу под ключ: замер, эскиз, изготовление, монтаж изделия из кварцевого агломерата выполнят мастера нашей компании.",
    icon: PackageCheck
  },
  {
    title: "Надёжно и безопасно",
    text:
      "В надёжности и безопасности готового изделия из кварцевого агломерата вы можете не сомневаться. Мы дорожим репутацией и даём гарантию на всё, что производим.",
    icon: ShieldCheck
  },
  {
    title: "Точно в срок",
    text:
      "Мы всегда чётко осознаём, что от нас зависят другие работы по оформлению интерьера, и вы должны получить всё вовремя. Поэтому мы никогда не нарушаем сроков.",
    icon: Clock3
  },
  {
    title: "Работаем руками",
    text:
      "Мы отлично знаем, что такое «вау-эффект», всегда помним о стиле, но не забываем о практической стороне. Вы получите лучший результат, и ваши инвестиции будут оправданы.",
    icon: Hammer
  },
  {
    title: "Думаем головой",
    text:
      "Мы имеем опыт работы с жилыми и коммерческими проектами, изучаем новые тенденции дизайна интерьера, производственные инновации и лучшее применяем на практике.",
    icon: Lightbulb
  },
  {
    title: "Чувствуем сердцем",
    text:
      "Мы поддерживаем вас в любом начинании, связанном с обновлением интерьера, — от концепции до установки и всегда стремимся соответствовать вашему видению.",
    icon: Heart
  }
];

export function HomeReasonsStrip() {
  return (
    <section
      className={`home-flow-section home-reasons-strip ${styles.strip}`}
      aria-labelledby="home-reasons-title"
    >
      <div className="container">
        <header className={styles.head}>
          <h2 id="home-reasons-title" className={styles.title}>
            Почему заказчики из Санкт-Петербурга выбирают ArtellRock
          </h2>
          <p className={styles.sub}>
            6 веских аргументов «за» для профессионалов и частных лиц
          </p>
        </header>

        <ul className={styles.grid}>
          {reasons.map((reason) => {
            const Icon = reason.icon;
            return (
              <li key={reason.title} className={styles.item}>
                <span className={styles.icon} aria-hidden>
                  <Icon className={styles.iconSvg} strokeWidth={1.75} />
                </span>
                <div className={styles.body}>
                  <h3 className={styles.itemTitle}>{reason.title}</h3>
                  <p className={styles.itemText}>{reason.text}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
