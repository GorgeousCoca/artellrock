export type ProductType = "countertops" | "window-sills" | "sinks" | "profiles";
export type StoneType = "quartz" | "acrylic" | "marble" | "granite";

export type SeoFields = {
  metaTitle?: string;
  metaDescription?: string;
  ogImage?: string;
  noIndex?: boolean;
};

export type Product = SeoFields & {
  id: string;
  slug: string;
  title: string;
  summary: string;
  description: string;
  basePrice: number;
  type: ProductType;
  material: string;
  color: string;
  thickness: string;
  features: string[];
  image: string;
  gallery: string[];
  isFeatured: boolean;
};

export type StoneSample = SeoFields & {
  id: string;
  slug: string;
  title: string;
  stoneType: StoneType;
  manufacturer: string;
  color: string;
  texture: string;
  thicknesses: string[];
  finish: string;
  description: string;
  image: string;
  isFeatured: boolean;
  priceFrom?: number | null;
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
};

export type TeamMember = {
  id: string;
  name: string;
  role: string;
  bio: string;
  image: string;
};

export type FaqItem = {
  id: string;
  question: string;
  answer: string;
  sortOrder: number;
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

export type Certificate = {
  id: string;
  title: string;
  fileUrl: string;
};

export type ContactRequest = {
  id: string;
  name: string;
  phone: string;
  email: string;
  message: string;
  source: string;
  deliveryStatus?: "pending" | "delivered" | "failed_mail";
  mailError?: string;
  attachmentUrl?: string;
  attachmentName?: string;
  attachmentSize?: number;
  createdAt: string;
};

export type VisitStats = Record<string, number>;

export type CompanySettings = SeoFields & {
  id: string;
  companyName: string;
  legalName: string;
  phone: string;
  secondaryPhone?: string;
  email: string;
  address: string;
  metro: string;
  inn: string;
  ogrn: string;
  mapEmbedUrl: string;
  heroTitle: string;
  heroSubtitle: string;
  primaryCta: string;
  seoDefaultTitle: string;
  seoDescription: string;
  statsClients?: string;
  statsBrands?: string;
  statsYears?: string;
};

export type CmsStore = {
  products: Product[];
  stoneSamples: StoneSample[];
  projects: Project[];
  teamMembers: TeamMember[];
  faqItems: FaqItem[];
  testimonials: Testimonial[];
  certificates: Certificate[];
  contactRequests: ContactRequest[];
  companySettings: CompanySettings;
};
