import { buildMetadata } from "@/lib/seo/metadata";

export const metadata = buildMetadata({
  title: "Политика конфиденциальности",
  description: "Политика обработки персональных данных и использования форм обратной связи.",
  path: "/privacy"
});

export default function PrivacyPage() {
  return (
    <section className="section">
      <div className="container">
        <article className="card stack content-prose">
          <h1 className="section-title">Политика конфиденциальности</h1>
          <p>
            Настоящая политика определяет порядок обработки и защиты персональных данных, которые
            пользователь оставляет через формы обратной связи на сайте компании.
          </p>
          <p>
            Мы собираем только те данные, которые необходимы для консультации, подготовки расчета и
            сопровождения заказа: имя, телефон, email и описание задачи.
          </p>
          <p>
            Данные не передаются третьим лицам без законных оснований и используются только в рамках
            взаимодействия по запросу пользователя.
          </p>
        </article>
      </div>
    </section>
  );
}
