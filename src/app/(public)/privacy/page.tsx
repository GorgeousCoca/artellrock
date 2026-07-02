import { buildMetadata } from "@/lib/seo/metadata";

import styles from "@/components/legal/privacy-page.module.scss";

export const metadata = buildMetadata({
  title: "Политика конфиденциальности",
  description:
    "Политика обработки персональных данных, файлов cookie и использования форм обратной связи.",
  path: "/privacy"
});

export default function PrivacyPage() {
  return (
    <section className={`section ${styles.page}`}>
      <div className="container">
        <article className={styles.article}>
          <header className={styles.header}>
            <span className="eyebrow">Документы</span>
            <h1 className={styles.title}>Политика конфиденциальности</h1>
            <nav className={styles.jumpNav} aria-label="Разделы документа">
              <a href="#privacy">Персональные данные</a>
              <a href="#cookies">Файлы cookie</a>
            </nav>
          </header>

          <section className={styles.section} id="privacy" aria-labelledby="privacy-title">
            <h2 className={styles.sectionTitle} id="privacy-title">
              Обработка персональных данных
            </h2>
            <div className={styles.bodyText}>
              <p>
                Настоящая политика определяет порядок обработки и защиты персональных данных, которые
                пользователь оставляет через формы обратной связи на сайте компании.
              </p>
              <p>
                Мы собираем только те данные, которые необходимы для консультации, подготовки расчёта
                и сопровождения заказа: имя, телефон, email и описание задачи.
              </p>
              <p>
                Данные не передаются третьим лицам без законных оснований и используются только в
                рамках взаимодействия по запросу пользователя.
              </p>
            </div>
          </section>

          <section className={styles.section} id="cookies" aria-labelledby="cookies-title">
            <h2 className={styles.sectionTitle} id="cookies-title">
              Файлы cookie и локальное хранилище
            </h2>
            <div className={styles.bodyText}>
              <p>
                Cookie — небольшие фрагменты данных, которые сайт может сохранять в браузере. Они
                помогают работать отдельным функциям (например, входу в закрытый раздел). Ниже —
                что именно использует сайт ArtellRock.
              </p>
            </div>

            <div className={styles.subsections}>
              <div className={styles.subsection}>
                <h3 className={styles.subsectionTitle}>Cookie на публичной части сайта</h3>
                <p className={styles.subsectionText}>
                  На публичных страницах подключена <strong>Яндекс.Метрика</strong> (счётчик
                  110345279) для анализа посещаемости, карт кликов и вебвизора. Сервис может
                  сохранять аналитические cookie и идентификаторы в браузере. Маркетинговые
                  cookie (рекламные пиксели) не используются.
                </p>
              </div>

              <div className={styles.subsection}>
                <h3 className={styles.subsectionTitle}>Технические cookie админ-панели</h3>
                <p className={styles.subsectionText}>
                  После входа в раздел <strong>/admin</strong> у авторизованного администратора
                  устанавливается cookie <code>admin_session</code> — зашифрованный сеанс на{" "}
                  <strong>8 часов</strong>. Параметры: только HTTP (недоступна из JavaScript на
                  странице), путь «/», SameSite=Lax; в production — только по HTTPS. Обычные
                  посетители сайта эту cookie не получают.
                </p>
              </div>

              <div className={styles.subsection}>
                <h3 className={styles.subsectionTitle}>Локальное хранилище браузера</h3>
                <p className={styles.subsectionText}>
                  При первом посещении может показываться информационная плашка о cookie. Если вы
                  нажмёте «Понятно», в браузере сохранится ключ{" "}
                  <code>cookie_notice_dismissed</code> со значением <code>1</code>, чтобы не
                  показывать плашку повторно. Эти данные{" "}
                  <strong>не отправляются на сервер</strong> и нужны только для вашего удобства.
                </p>
              </div>

              <div className={styles.subsection}>
                <h3 className={styles.subsectionTitle}>Статистика посещений</h3>
                <p className={styles.subsectionText}>
                  Для внутренней статистики сайт отправляет на сервер адрес просмотренной страницы
                  (без cookie в браузере). Счётчик хранится на сервере и не позволяет
                  идентифицировать конкретного пользователя между визитами.
                </p>
              </div>

              <div className={styles.subsection}>
                <h3 className={styles.subsectionTitle}>Как управлять cookie и хранилищем</h3>
                <p className={styles.subsectionText}>
                  Вы можете удалить cookie и данные сайта в настройках браузера (разделы
                  «Конфиденциальность», «Файлы cookie», «Данные сайтов»). После очистки
                  информационная плашка может появиться снова.
                </p>
              </div>
            </div>

            <p className={styles.updated}>Последнее обновление раздела о cookie: 2 июля 2026 г.</p>
          </section>
        </article>
      </div>
    </section>
  );
}
