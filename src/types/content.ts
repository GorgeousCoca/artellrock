export type SeoFields = {
  metaTitle?: string;
  metaDescription?: string;
  ogImage?: string;
  noIndex?: boolean;
};

export type Project = SeoFields & {
  id: string;
  slug: string;
  title: string;
  category: string;
  location: string;
  summary: string;
  description: string;
  beforeImage?: string;
  afterImage?: string;
  gallery: string[];
  testimonial?: string;
  productRefs: string[];
  /** Порядок на странице «Наши работы»: меньше — выше. */
  sortOrder?: number;
};

export type TestimonialStatus = "pending" | "approved" | "rejected";
export type TestimonialSource = "site" | "vk" | "avito" | "manual";

export type Testimonial = {
  id: string;
  author: string;
  role: string;
  quote: string;
  rating: number;
  status: TestimonialStatus;
  source: TestimonialSource;
  sourceUrl?: string;
  createdAt: string;
};

export type ContactRequest = {
  id: string;
  name: string;
  phone: string;
  /** Ник Telegram из формы чертежа. Пусто у остальных заявок. */
  telegram?: string;
  email: string;
  message: string;
  source: string;
  deliveryStatus?: "pending" | "delivered" | "failed_mail";
  mailError?: string;
  attachmentUrl?: string;
  attachmentName?: string;
  attachmentSize?: number;
  /** Расчёт из калькулятора (снимок на момент заявки). */
  estimateTotal?: number;
  estimate?: Record<string, unknown>;
  createdAt: string;
};

export type VisitStats = Record<string, number>;
