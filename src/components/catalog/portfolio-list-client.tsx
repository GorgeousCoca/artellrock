"use client";

import { useRef, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import { MediaCard } from "@/components/ui/content";
import type { Project } from "@/types/content";

function useInView() {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { threshold: 0.05, rootMargin: "0px 0px -40px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return { ref, inView };
}

function AnimatedItem({
  project,
  index,
}: {
  project: Project;
  index: number;
}) {
  const { ref, inView } = useInView();
  const delay = (index % 4) * 0.1;

  return (
    <div
      ref={ref}
      className={`portfolio-bento__wrap ${index === 0 ? "card--featured" : ""}`}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? "none" : "translateY(30px)",
        transition: `opacity 0.5s ease-out ${delay}s, transform 0.5s ease-out ${delay}s`,
      }}
    >
      <MediaCard
        className="portfolio-bento__card"
        href={`/portfolio/${project.slug}`}
        title={project.title}
        description={project.summary}
        label={project.category}
        meta={project.location}
        imageUrl={project.gallery[0] ?? "/images/quartz-project-composition.svg"}
        imagePriority={index === 0}
      />
    </div>
  );
}

export function PortfolioListClient({ projects }: { projects: Project[] }) {
  const searchParams = useSearchParams();
  const category = searchParams.get("category");
  const filtered = category
    ? projects.filter((p) => p.category === category)
    : projects;

  return (
    <div className="portfolio-bento">
      {filtered.map((project, index) => (
        <AnimatedItem key={project.id} project={project} index={index} />
      ))}
    </div>
  );
}
