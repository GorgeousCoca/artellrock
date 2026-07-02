"use client";

import { useSearchParams } from "next/navigation";

import { MediaCard } from "@/components/ui/content";
import type { Project } from "@/types/content";

export function PortfolioListClient({
  projects,
  className
}: {
  projects: Project[];
  className?: string;
}) {
  const searchParams = useSearchParams();
  const category = searchParams.get("category");
  const filtered = category ? projects.filter((project) => project.category === category) : projects;

  return (
    <div className={className ?? "grid grid-2"}>
      {filtered.map((project, index) => (
        <MediaCard
          key={project.id}
          href={`/portfolio/${project.slug}`}
          title={project.title}
          description={project.summary}
          label={project.category}
          meta={project.location}
          imageUrl={project.gallery[0] ?? "/images/quartz-project-composition.svg"}
          imagePriority={index === 0}
        />
      ))}
    </div>
  );
}
