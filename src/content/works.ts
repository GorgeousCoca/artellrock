/* Файл собран скриптом scripts/generate-site-content.mjs из PHOTOS.md. Вручную не правьте. */

export type Work = {
  id: string;
  image: string;
  /** Тип изделия — ровно то, что написано у кадра в PHOTOS.md. */
  label: string;
  /** Заголовок карточки, если подпись длиннее типа изделия. */
  title?: string;
  /** Короткий текст карточки: из чего изделие и как собрано. */
  text?: string;
};

export const works: Work[] = [
  {
    "id": "Avarus-Primer",
    "image": "/images/Avarus-Primer.webp",
    "label": "Столешница"
  },
  {
    "id": "podokonnik-01",
    "image": "/images/podokonnik-01.webp",
    "label": "Подоконник"
  },
  {
    "id": "podokonnik-02",
    "image": "/images/podokonnik-02.webp",
    "label": "Подоконник"
  },
  {
    "id": "podokonnik-03",
    "image": "/images/podokonnik-03.webp",
    "label": "Подоконник и столешница у окна"
  },
  {
    "id": "Avant_Quartz-01",
    "image": "/images/portfolio-brands/Avant_Quartz-01.jpg",
    "label": "Столешница и фартук"
  },
  {
    "id": "Avant_Quartz-02",
    "image": "/images/portfolio-brands/Avant_Quartz-02.jpg",
    "label": "Столешница и фартук"
  },
  {
    "id": "Avant_Quartz-03",
    "image": "/images/portfolio-brands/Avant_Quartz-03.jpg",
    "label": "Столешница и фартук"
  },
  {
    "id": "Avant_Quartz-04",
    "image": "/images/portfolio-brands/Avant_Quartz-04.jpg",
    "label": "Столешница"
  },
  {
    "id": "Avant_Quartz-05",
    "image": "/images/portfolio-brands/Avant_Quartz-05.jpg",
    "label": "Столешница"
  },
  {
    "id": "Avant_Quartz-06",
    "image": "/images/portfolio-brands/Avant_Quartz-06.jpg",
    "label": "Столешница"
  },
  {
    "id": "Avant_Quartz-07",
    "image": "/images/portfolio-brands/Avant_Quartz-07.jpg",
    "label": "Столешница у окна"
  },
  {
    "id": "Avant_Quartz-08",
    "image": "/images/portfolio-brands/Avant_Quartz-08.jpg",
    "label": "Остров и столешница"
  },
  {
    "id": "Avant_Quartz-09",
    "image": "/images/portfolio-brands/Avant_Quartz-09.jpg",
    "label": "Остров"
  },
  {
    "id": "Avant_Quartz-10",
    "image": "/images/portfolio-brands/Avant_Quartz-10.jpg",
    "label": "Столешница"
  },
  {
    "id": "Avarus-01",
    "image": "/images/portfolio-brands/Avarus-01.jpg",
    "label": "Столешница"
  },
  {
    "id": "Avarus-04",
    "image": "/images/portfolio-brands/Avarus-04.jpg",
    "label": "Столешница и мойка"
  },
  {
    "id": "Avarus-05",
    "image": "/images/portfolio-brands/Avarus-05.jpg",
    "label": "Столешница"
  },
  {
    "id": "Avarus-06",
    "image": "/images/portfolio-brands/Avarus-06.jpg",
    "label": "Столешница и остров"
  },
  {
    "id": "Avarus-07",
    "image": "/images/portfolio-brands/Avarus-07.jpg",
    "label": "Столешница и остров"
  },
  {
    "id": "Avarus-08",
    "image": "/images/portfolio-brands/Avarus-08.jpg",
    "label": "Остров"
  },
  {
    "id": "Avarus-09",
    "image": "/images/portfolio-brands/Avarus-09.jpg",
    "label": "Столешница и подоконник"
  },
  {
    "id": "Nobell_Quartz-01",
    "image": "/images/portfolio-brands/Nobell_Quartz-01.jpg",
    "label": "Столешница"
  },
  {
    "id": "Nobell_Quartz-02",
    "image": "/images/portfolio-brands/Nobell_Quartz-02.jpg",
    "label": "Столешница"
  },
  {
    "id": "Nobell_Quartz-03",
    "image": "/images/portfolio-brands/Nobell_Quartz-03.jpg",
    "label": "Столешница и стеновая панель"
  },
  {
    "id": "Nobell_Quartz-04",
    "image": "/images/portfolio-brands/Nobell_Quartz-04.jpg",
    "label": "Столешница и стеновая панель"
  },
  {
    "id": "Nobell_Quartz-05",
    "image": "/images/portfolio-brands/Nobell_Quartz-05.jpg",
    "label": "Столешница и стеновая панель"
  },
  {
    "id": "Smart_Quartz-01",
    "image": "/images/portfolio-brands/Smart_Quartz-01.jpg",
    "label": "Столешница и стеновая панель"
  },
  {
    "id": "Smart_Quartz-02",
    "image": "/images/portfolio-brands/Smart_Quartz-02.jpg",
    "label": "Столешница, мойка и стеновая панель"
  },
  {
    "id": "Smart_Quartz-03",
    "image": "/images/portfolio-brands/Smart_Quartz-03.jpg",
    "label": "Столешница, мойка и стеновая панель"
  },
  {
    "id": "Smart_Quartz-04",
    "image": "/images/portfolio-brands/Smart_Quartz-04.jpg",
    "label": "Столешница и стеновая панель"
  }
];
