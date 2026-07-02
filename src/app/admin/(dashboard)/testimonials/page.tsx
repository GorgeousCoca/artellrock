import { TestimonialsAdmin } from "@/components/admin/testimonials-admin";
import { getTestimonials } from "@/lib/site";

export default async function AdminTestimonialsPage() {
  const testimonials = await getTestimonials();
  return <TestimonialsAdmin testimonials={testimonials} />;
}
