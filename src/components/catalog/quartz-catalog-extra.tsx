import Link from "next/link";

import { OrderCallButton } from "@/components/site/callback-dialog";
import { Photo } from "@/components/site/photo";
import { ReasonsDark } from "@/components/site/reasons-dark";
import { leadForm } from "@/content/artellrock";

const notes = [
  {
    title: "Производство и состав",
    text: "Агломерат практически полностью (минимум на 90 процентов) состоит из натурального камня (кварцевый песок, иногда с добавлением других минералов, например гранитной или мраморной крошки). К нему добавляют смолы и спекают получившуюся массу. После остывания этот материал уже нельзя будет изгибать, даже при нагреве. По свойствам он будет приближен к натуральному камню, но только с более практичной поверхностью без микротрещин и пор."
  },
  {
    title: "Характеристики",
    text: "Цена кварцевого агломерата выше, чем у акрилового камня, но ниже, чем у натуральных материалов. Он достаточно прочный. Например, если уронить на него кастрюлю или ножницы, следов, скорее всего, не останется. Кроме того, он не боится нагрева до 400 градусов. Но из-за высокой прочности этого материала его невозможно смонтировать так, чтобы не осталось швов в местах стыков. Швы слегка видны, но выглядят достаточно эстетично, особенно на контрастных фактурах."
  },
  {
    title: "Область применения",
    text: "В отличие от того же гранита кварцевый агломерат соответствует стандартам экологической безопасности на 100 %. Он не выделяет в окружающую среду опасных веществ и радиоактивных элементов, поэтому может использоваться для оформления интерьера практически в любом помещении. Нередко его закупают при строительстве/ремонте детских образовательных учреждений, больниц и даже медицинских, испытательных лабораторий, в которых должна поддерживаться абсолютная стерильность."
  },
  {
    title: "Эксплуатация и уход",
    text: "Купить кварцевый агломерат рекомендуется людям, для которых гигиена играет большую роль. Он отличается гладкой поверхностью, исключающей скопление грязи и размножение бактерий. Если поверхность изделий запачкается, достаточно протереть её салфеткой, чтобы снова привести в полный порядок. Кварцевый камень сложно повредить, но учтите, что, если скол или царапина всё-таки образуются, их будет практически невозможно убрать собственными силами, без помощи специалистов."
  }
] as const;

const gallery = [
  { src: "/images/catalog/quartz-bath.png", alt: "Ванная комната: серый кварц на стенах, полу и столешнице" },
  { src: "/images/catalog/quartz-kitchen-light.png", alt: "Светлая кухня со столешницей из кварца" },
  { src: "/images/catalog/quartz-dining.png", alt: "Кухня с кварцевым фартуком и обеденным столом" },
  { src: "/images/catalog/quartz-bar.png", alt: "Кухня с барной стойкой из кварца" }
] as const;

export function QuartzCatalogExtra() {
  return (
    <>
      <section className="quartz-extra" aria-labelledby="quartz-cost-title">
        <h2 id="quartz-cost-title" className="quartz-extra__title">
          Стоимость кварцевого агломерата
        </h2>
        <p>
          Цена выбранного декора указана на его странице. Сводка по материалу, кромке и мойкам собрана в прайс-листе.
          Итог изделия называем после бесплатного замера.
        </p>
        <div className="quartz-extra__actions">
          <Link className="btn btn--primary" href="/tseny">
            Прайс-лист
          </Link>
          <Link className="btn btn--secondary" href="/kalkulyator">
            Калькулятор
          </Link>
          <OrderCallButton
            className="btn btn--secondary"
            label="Заказать образцы домой"
            source="Заказ образцов"
            idPrefix="obrazcy"
          />
        </div>
      </section>
      <ul className="quartz-gallery">
        {gallery.map((photo) => (
          <li key={photo.src}>
            <Photo src={photo.src} alt={photo.alt} sizes="(max-width: 700px) 70vw, 320px" />
          </li>
        ))}
      </ul>
      <section className="quartz-extra quartz-notes" aria-labelledby="quartz-notes-title">
        <h2 id="quartz-notes-title" className="quartz-extra__title">
          Особенности кварцевого агломерата
        </h2>
        <ul>
          {notes.map((note) => (
            <li key={note.title}>
              <h3>{note.title}</h3>
              <p>{note.text}</p>
            </li>
          ))}
        </ul>
      </section>
      <ReasonsDark id="quartz-reasons-title" />
      <section className="quartz-consult" aria-labelledby="quartz-consult-title">
        <div>
          <h2 id="quartz-consult-title">Бесплатная консультация и вызов замерщика</h2>
          <p>{leadForm.lead}</p>
        </div>
        <OrderCallButton
          className="btn btn--primary"
          label="Оставить заявку"
          source="Консультация"
          idPrefix="consult"
        />
      </section>
    </>
  );
}
