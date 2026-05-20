export type AdminField = {
  name: string;
  label: string;
  type: "text" | "textarea" | "number" | "checkbox";
};

export const adminCollections = {
  products: {
    title: "Изделия",
    description: "Управление карточками каталога",
    fields: [
      { name: "slug", label: "Slug", type: "text" },
      { name: "title", label: "Название", type: "text" },
      { name: "summary", label: "Краткое описание", type: "textarea" },
      { name: "description", label: "Полное описание", type: "textarea" },
      { name: "basePrice", label: "Цена от", type: "number" },
      { name: "type", label: "Тип", type: "text" },
      { name: "material", label: "Материал", type: "text" },
      { name: "color", label: "Цвет", type: "text" },
      { name: "thickness", label: "Толщина", type: "text" },
      { name: "features", label: "Особенности через запятую", type: "textarea" },
      { name: "image", label: "Изображение", type: "text" },
      { name: "gallery", label: "Галерея через запятую", type: "textarea" },
      { name: "isFeatured", label: "Показывать как featured", type: "checkbox" },
      { name: "metaTitle", label: "Meta title", type: "text" },
      { name: "metaDescription", label: "Meta description", type: "textarea" }
    ] satisfies AdminField[]
  },
  stoneSamples: {
    title: "Каталог камня",
    description: "Образцы и декоры",
    fields: [
      { name: "slug", label: "Slug", type: "text" },
      { name: "title", label: "Название", type: "text" },
      { name: "stoneType", label: "Тип камня", type: "text" },
      { name: "manufacturer", label: "Производитель", type: "text" },
      { name: "color", label: "Цвет", type: "text" },
      { name: "texture", label: "Текстура", type: "text" },
      { name: "thicknesses", label: "Толщины через запятую", type: "textarea" },
      { name: "finish", label: "Финиш", type: "text" },
      { name: "description", label: "Описание", type: "textarea" },
      { name: "image", label: "Изображение", type: "text" },
      { name: "isFeatured", label: "Показывать как featured", type: "checkbox" }
    ] satisfies AdminField[]
  },
  projects: {
    title: "Портфолио",
    description: "Кейсы, галереи и отзывы",
    fields: [
      { name: "slug", label: "Slug", type: "text" },
      { name: "title", label: "Название", type: "text" },
      { name: "category", label: "Категория", type: "text" },
      { name: "location", label: "Локация", type: "text" },
      { name: "summary", label: "Краткое описание", type: "textarea" },
      { name: "description", label: "Описание", type: "textarea" },
      { name: "beforeImage", label: "Фото до", type: "text" },
      { name: "afterImage", label: "Фото после", type: "text" },
      { name: "gallery", label: "Галерея через запятую", type: "textarea" },
      { name: "testimonial", label: "Отзыв клиента", type: "textarea" },
      { name: "productRefs", label: "Связанные товары через запятую", type: "textarea" }
    ] satisfies AdminField[]
  },
  blogCategories: {
    title: "Категории блога",
    description: "Категории для SEO-статей",
    fields: [
      { name: "slug", label: "Slug", type: "text" },
      { name: "title", label: "Название", type: "text" }
    ] satisfies AdminField[]
  },
  blogPosts: {
    title: "Статьи",
    description: "Публикации блога",
    fields: [
      { name: "slug", label: "Slug", type: "text" },
      { name: "title", label: "Название", type: "text" },
      { name: "excerpt", label: "Анонс", type: "textarea" },
      { name: "content", label: "Текст", type: "textarea" },
      { name: "image", label: "Изображение", type: "text" },
      { name: "videoUrl", label: "Видео URL", type: "text" },
      { name: "categoryId", label: "ID категории", type: "text" },
      { name: "keywords", label: "Ключевые слова через запятую", type: "textarea" },
      { name: "publishedAt", label: "Дата публикации ISO", type: "text" }
    ] satisfies AdminField[]
  },
  teamMembers: {
    title: "Команда",
    description: "Сотрудники и роли",
    fields: [
      { name: "name", label: "Имя", type: "text" },
      { name: "role", label: "Роль", type: "text" },
      { name: "bio", label: "Биография", type: "textarea" },
      { name: "image", label: "Изображение", type: "text" }
    ] satisfies AdminField[]
  },
  testimonials: {
    title: "Отзывы",
    description: "Отзывы клиентов",
    fields: [
      { name: "author", label: "Автор", type: "text" },
      { name: "role", label: "Роль", type: "text" },
      { name: "quote", label: "Текст отзыва", type: "textarea" },
      { name: "rating", label: "Рейтинг", type: "number" }
    ] satisfies AdminField[]
  },
  certificates: {
    title: "Сертификаты",
    description: "Документы и гарантийные материалы",
    fields: [
      { name: "title", label: "Название", type: "text" },
      { name: "fileUrl", label: "Файл/изображение", type: "text" }
    ] satisfies AdminField[]
  }
};

export type AdminCollectionKey = keyof typeof adminCollections;
