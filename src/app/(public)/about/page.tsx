import Link from "next/link";
import Image from "next/image";

import { PageHero } from "@/components/ui/content";
import { toTelHref } from "@/lib/company-phones";
import { buildMetadata } from "@/lib/seo/metadata";
import { getTeamMembers } from "@/lib/site";

const socialLinks = {
  vk: "https://vk.com/club230045850?ysclid=mo5ny4mikt343003951",
  avito: "https://www.avito.ru/"
};

const teamPhonesByName: Record<string, string> = {
  "Виталий Смирнов": "+7 (965) 012-30-74",
  "Александр Попов": "+7 (999) 219-41-28"
};

export const metadata = buildMetadata({
  title: "О компании",
  description:
    "Небольшая мастерская в Санкт-Петербурге: производство и сопровождение заказа ведут два человека — без лишних посредников.",
  path: "/about"
});

export default async function AboutPage() {
  const team = await getTeamMembers();

  return (
    <>
      <PageHero
        eyebrow="О компании"
        title="Два человека — от замера до производства"
        titleClassName="catalog-category-hero-title"
        descriptionClassName="page-hero__lead page-hero__lead--large"
        visualBadgeText="Наша команда"
        visualImageSrc="/images/team-colleagues.png"
        visualImageAlt="Команда ArtellRock — два специалиста в мастерской"
        description="За ArtellRock стоит не отдел продаж и не субподрядная сеть, а двое высококвалифицированных специалиста: вы общаетесь с теми же людьми, кто ведёт проект и работает на производстве. Это компактная мастерская, где ответственность не размывается по отделам."
      />

      <div className="about-page">
        <section className="section">
          <div className="container grid grid-2 about-top-row">
            <div className="card card--glass stack about-intro-card">
            <h2>Как мы устроены</h2>
            <p>
              Изделия из кварцевого агломерата на заказ в Санкт-Петербурге и области мы делаем сами —
              замер, расчёт, распил и обработка, контроль качества и сопровождение до монтажа. Вся
              «линейка» от заявки до готовой детали проходит через двух специалистов: так проще
              держать сроки, геометрию и обещания клиенту в одном контексте.
            </p>
            <div className="metrics-grid">
              <div className="metric-card card--glass stack">
                <strong>Живое производство</strong>
                <span className="muted">
                  Участок обработки и сборки — наш; нет очереди анонимных бригад «на выезд».
                </span>
              </div>
              <div className="metric-card card--glass stack">
                <strong>Один контакт</strong>
                <span className="muted">
                  Вопросы по срокам и по станку решают те же люди, с кем вы договаривались в начале.
                </span>
              </div>
            </div>
            </div>
            <div className="card card--glass media-card about-production-card">
              <Image
                className="media-image"
                src="/images/proizvodstvo.webp"
                alt="Производственный подход ArtellRock"
                width={1400}
                height={980}
                style={{ height: 390 }}
              />
              <div className="media-card__content">
                <strong>Производство на двоих</strong>
                <p>
                  Небольшой цех и руки мастеров — без раздутого штата: именно поэтому мы можем
                  внимательно относиться к каждому заказу.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="container">
            <div className="section-header">
              <span className="eyebrow">Команда</span>
              <h2 className="section-title catalog-category-hero-title">Это и есть вся компания</h2>
              <p>
                Ниже — два человека, через которых проходит весь заказ: переговоры, производство и
                ответственность за результат.
              </p>
            </div>
            <div className="grid grid-2">
              {team.map((member) => {
                const imageSrc = member.image || "/images/quartz-surface-light.svg";

                return (
                  <article key={member.id} className="card card--glass media-card">
                    <Image
                      className="media-image about-team-image"
                      src={imageSrc}
                      alt={member.name}
                      width={1600}
                      height={1000}
                    />
                    <div className="media-card__content stack">
                      <h3>{member.name}</h3>
                      <span className="muted">{member.role}</span>
                      {teamPhonesByName[member.name] ? (
                        <a href={toTelHref(teamPhonesByName[member.name])}>{teamPhonesByName[member.name]}</a>
                      ) : null}
                      <p>{member.bio}</p>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="section">
          <div className="container">
            <div className="section-header">
              <span className="eyebrow">Надежность и отзывы</span>
              <h2 className="section-title catalog-category-hero-title">Подтверждение качества материалов и монтажных работ</h2>
            </div>
            <div className="card card--glass stack">
              <p>
                Нам можно доверять: у нас есть реальные отзывы клиентов и открытые площадки, где вы
                можете посмотреть качество работ и обратную связь.
              </p>
              <div className="btn-row">
                <Link className="button" href={socialLinks.vk} rel="noreferrer" target="_blank">
                  Отзывы в VK
                </Link>
                <Link className="button-secondary" href={socialLinks.avito} rel="noreferrer" target="_blank">
                  Отзывы на Avito
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
