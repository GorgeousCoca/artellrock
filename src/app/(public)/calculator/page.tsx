import Link from "next/link";
import Image from "next/image";

import { CalculatorForm } from "@/components/forms/calculator-form";
import { PageHero } from "@/components/ui/content";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata = buildMetadata({
  title: "Калькулятор стоимости изделий из кварцевого агломерата",
  description:
    "Онлайн-калькулятор для предварительного расчета столешницы, подоконника или мойки из кварцевого агломерата.",
  path: "/calculator"
});

const landing = {
  heroTitle: "Расчёт стоимости изделий из кварца в Санкт-Петербурге",
  heroDescription:
    "Оцените бюджет по размерам и толщине до замера, получите ориентир по стоимости и перейдите к заявке.",
  heroPromo: "Предварительный расчёт онлайн",
  heroPriceFrom: "ориентир по материалу и толщине",
  heroImageSrc: "/images/portfolio-brands/Avarus-01.jpg",
  heroImageAlt: "Пример изделия из кварцевого агломерата для ориентира по расчёту",
  heroBadgeText: "Ориентир по материалу Avarus",
  introTitle: "Зачем нужен калькулятор перед заказом",
  introText: [
    "Калькулятор помогает быстро понять порядок цены по площади и толщине — без ожидания ответа менеджера.",
    "Это не финальная смета: после замера мы уточним кромку, вырезы, логистику и монтаж, но вы уже будете понимать масштаб бюджета."
  ],
  featureTitle: "Что учитывает расчёт",
  featureIntro:
    "Модель строится на типовых параметрах кварцевого агломерата по площади и толщине слэба.",
  sellingPoints: [
    "Площадь по длине и ширине заготовки",
    "Толщина слэба и коэффициент на материал",
    "Базовая ставка за материал без учёта вырезов и кромки"
  ],
  pricingTitle: "Как получить точную стоимость после калькулятора",
  pricingText: [
    "Отправьте заявку из калькулятора или напишите нам — подключим менеджера и согласуем выезд на замер.",
    "После замера подготовим коммерческое предложение с учётом профиля кромки, количества вырезов и условий монтажа."
  ],
  colorsTitle: "Материал и декор",
  colorsText: [
    "В калькуляторе задан кварцевый агломерат как базовый материал. Конкретный декор и бренд подбираются отдельно — по каталогу или с образцами на объекте.",
    "Итоговая цена может меняться в зависимости от выбранной коллекции и доступности слэба на складе."
  ],
  showcaseTitle: "Типовые сценарии, для которых подходит расчёт",
  showcaseText:
    "Ниже — примеры изделий: калькулятор даёт ориентир по материалу и базовым работам. Финальная сумма зависит от геометрии, фурнитуры и монтажа.",
  showcaseExamples: [
    {
      title: "Серый подоконник из искусственного камня",
      details: ["VicoStone BQ-9470 Azul Aran"],
      image: "/images/podokonnik-01.jpg"
    },
    {
      title: "Эркерный бесшовный подоконник",
      details: ["Primax S-5040 Pure White"],
      image: "/images/podokonnik-02.jpg"
    },
    {
      title: "Светлая столешница из кварцевого агломерата",
      details: ["Avant Quartz 7030"],
      image: "/images/portfolio-brands/Avant_Quartz-01.jpg"
    }
  ],
  trustTitle: "Почему клиенты выбирают нас",
  trustCards: [
    {
      title: "Гарантируем качество",
      text: "Контролируем производство и монтаж, чтобы изделие служило долго и соответствовало согласованному расчёту."
    },
    {
      title: "Соблюдаем сроки",
      text: "После заявки фиксируем этапы: замер, производство, доставка и установка — без пропадания на связи."
    },
    {
      title: "Индивидуальный подход",
      text: "Подбираем материал и конфигурацию под ваш объект — от подоконника до сложной столешницы."
    }
  ],
  whyCards: [
    {
      title: "Прозрачность",
      text: "Калькулятор и последующая смета после замера — без скрытых доплат в базовой комплектации."
    },
    {
      title: "Цена",
      text: "Если найдёте аналогичное предложение дешевле, обсудим условия на своё усмотрение."
    }
  ],
  finalTitle: "Нужен расчёт под ваш объект?",
  finalText:
    "Пришлите размеры, фото или план — подскажем оптимальную конфигурацию и подготовим смету после замера."
};

export default function CalculatorPage() {
  return (
    <>
      <PageHero
        eyebrow={landing.heroPromo}
        title={landing.heroTitle}
        titleClassName="catalog-category-hero-title"
        visualImageSrc={landing.heroImageSrc}
        visualImageAlt={landing.heroImageAlt}
        visualBadgeText={landing.heroBadgeText}
        description={landing.heroDescription}
        actions={
          <>
            <span className="pill">{landing.heroPriceFrom}</span>
            <Link className="button" href="#calculator-form">
              Начать расчёт
            </Link>
            <Link className="button-secondary" href="/catalog-kamnya">
              Смотреть каталог камня
            </Link>
          </>
        }
      />

      <section className="section">
        <div className="container grid grid-2">
          <article className="card card--glass stack content-prose">
            <h2>{landing.introTitle}</h2>
            <div className="stack">
              {landing.introText.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
            <h3>{landing.featureTitle}</h3>
            <p>{landing.featureIntro}</p>
            <div className="stack product-list">
              {landing.sellingPoints.map((point) => (
                <span key={point}>{point}</span>
              ))}
            </div>
          </article>
          <article className="card card--glass stack content-prose">
            <h2>{landing.pricingTitle}</h2>
            <div className="stack">
              {landing.pricingText.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
            <div className="btn-row">
              <Link className="button" href="/contacts">
                Узнать стоимость изделий
              </Link>
              <Link className="button-secondary" href="/catalog/window-sills">
                Подоконники из камня
              </Link>
            </div>
            <h3>{landing.colorsTitle}</h3>
            <div className="stack">
              {landing.colorsText.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </article>
        </div>
      </section>

      <section className="section">
        <div className="container grid grid-3">
          <article className="card card--glass stack content-prose" style={{ gridColumn: "1 / -1" }}>
            <h2>{landing.showcaseTitle}</h2>
            <p>{landing.showcaseText}</p>
          </article>
          {landing.showcaseExamples.map((item) => (
            <article key={item.title} className="card card--glass media-card stack content-prose">
              {item.image ? (
                <Image
                  className="media-image"
                  src={item.image}
                  alt={item.title}
                  width={800}
                  height={500}
                  style={{ width: "100%", height: "240px", objectFit: "cover" }}
                  sizes="(max-width: 900px) 100vw, 33vw"
                />
              ) : null}
              <div className="media-card__content stack">
                <h3>{item.title}</h3>
                <div className="stack product-list">
                  {item.details.map((detail) => (
                    <span key={detail}>{detail}</span>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="container grid grid-3">
          <article className="card card--glass stack" style={{ gridColumn: "1 / -1" }}>
            <h2>{landing.trustTitle}</h2>
          </article>
          {landing.trustCards.map((item) => (
            <article key={item.title} className="card card--glass stack content-prose">
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
          {landing.whyCards.map((item) => (
            <article key={item.title} className="card card--glass stack content-prose">
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section" id="calculator-form">
        <div className="container">
          <article className="card card--glass stack content-prose">
            <h2 className="section-title" style={{ marginBottom: "0.25rem" }}>
              Онлайн-калькулятор
            </h2>
            <p className="muted" style={{ marginBottom: "1rem" }}>
              Задайте размеры и толщину — сумма обновляется автоматически. Это ориентир по материалу без вырезов и кромки.
            </p>
            <CalculatorForm />
          </article>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <article className="card card--glass stack content-prose">
            <h2>{landing.finalTitle}</h2>
            <p>{landing.finalText}</p>
            <div className="btn-row">
              <Link className="button" href="/contacts">
                Оставить заявку
              </Link>
              <Link className="button-ghost" href="/catalog-kamnya">
                Каталог камня
              </Link>
            </div>
          </article>
        </div>
      </section>
    </>
  );
}
