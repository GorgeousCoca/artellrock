import { quartzBrands } from "@/content/quartz-decors";
import { stoneCatalog } from "@/content/stone-catalog";
import { hasCertificates, manufacturerCertificates, processorCertificates } from "@/content/trust";

/**
 * Страница «О компании»: карточки-переходы и блок фактов.
 * Только настоящие данные: числа считаются из каталога, а не вписаны руками.
 */

export const aboutPage = {
  h1: "О компании ArtellRock",
  factsTitle: "Факты о нашей мастерской"
};

export type AboutCardMedia =
  | { kind: "photo"; src: string; alt: string; fit?: "contain" }
  /** Логотипы Авито и ВК: отзывы на странице настоящие, скриншоты не нужны. */
  | { kind: "sources" };

export type AboutCard = {
  title: string;
  href: string;
  media: AboutCardMedia;
  /** Для скринридеров: куда ведёт кнопка. */
  actionLabel: string;
};

/** Первый скан сертификата, если владелец уже загрузил хотя бы один. */
function firstCertificateImage() {
  return [...processorCertificates, ...manufacturerCertificates][0];
}

/**
 * Четыре карточки. Пока нет ни одного скана сертификата, страница «Сертификаты» закрыта от индексации,
 * поэтому вместо неё показываем каталог кварца. Как только появится скан, на её месте встанут сертификаты.
 */
export function aboutCards(): AboutCard[] {
  const certificate = firstCertificateImage();

  const third: AboutCard =
    hasCertificates && certificate
      ? {
          title: "Сертификаты",
          href: "/sertifikaty",
          media: { kind: "photo", src: certificate.image, alt: certificate.alt },
          actionLabel: "Сертификаты, подробнее"
        }
      : {
          title: "Каталог кварца",
          href: "/catalog-kvarca",
          media: {
            kind: "photo",
            src: "/images/stones/aleph-stone/a75-arabescato-delicato/texture.jpg",
            alt: "Декор кварцевого агломерата Aleph Stone Arabescato Delicato"
          },
          actionLabel: "Каталог кварца, подробнее"
        };

  return [
    {
      title: "Портфолио. Наши работы",
      href: "/portfolio",
      media: { kind: "photo", src: "/images/portfolio/case-island-light.jpg", alt: "Светлый кухонный остров из кварцевого агломерата" },
      actionLabel: "Портфолио, подробнее"
    },
    {
      title: "Отзывы о нас",
      href: "/otzivy",
          media: { kind: "photo", src: "/images/about/vashi-otzyvy.png", alt: "Ваши отзывы", fit: "contain" },
      actionLabel: "Отзывы, подробнее"
    },
    third,
    {
      title: "Как оформить заказ?",
      href: "/kak-zakazat",
      media: { kind: "photo", src: "/images/about/handshake.png", alt: "Рукопожатие", fit: "contain" },
      actionLabel: "Как оформить заказ, подробнее"
    }
  ];
}

export type AboutFact = { value: string; text: string };

/** Округляем вниз до сотни: «500+» остаётся правдой, даже если пара декоров уйдёт из каталога. */
function roundedDown(count: number) {
  return `${Math.floor(count / 100) * 100}+`;
}

export function aboutFacts(): AboutFact[] {
  return [
    { value: "3", text: "человека в команде: замер, изготовление и монтаж ведём сами" },
    { value: String(quartzBrands.length), text: "брендов кварцевого агломерата в нашем каталоге" },
    { value: roundedDown(stoneCatalog.length), text: "декоров разных цветов и фактур с ценой за квадратный метр" },
    { value: "0 ₽", text: "стоит выезд мастера на замер по Санкт-Петербургу и области" }
  ];
}
