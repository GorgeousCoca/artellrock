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

export type BlogCategory = {
  id: string;
  slug: string;
  title: string;
};

export type BlogPost = SeoFields & {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  image: string;
  videoUrl?: string;
  categoryId: string;
  keywords: string[];
  publishedAt: string;
};

export type TeamMember = {
  id: string;
  name: string;
  role: string;
  bio: string;
  image: string;
};

export type Testimonial = {
  id: string;
  author: string;
  role: string;
  quote: string;
  rating: number;
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
  createdAt: string;
};

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
};

export type CmsStore = {
  products: Product[];
  stoneSamples: StoneSample[];
  projects: Project[];
  blogCategories: BlogCategory[];
  blogPosts: BlogPost[];
  teamMembers: TeamMember[];
  testimonials: Testimonial[];
  certificates: Certificate[];
  contactRequests: ContactRequest[];
  companySettings: CompanySettings;
};
