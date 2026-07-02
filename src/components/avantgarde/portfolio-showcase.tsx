"use client";

import Link from "next/link";

import type { Project } from "@/types/content";

import styles from "./avantgarde-home.module.scss";

type PortfolioShowcaseProps = {
  projects: Project[];
};

export function PortfolioShowcase({ projects }: PortfolioShowcaseProps) {
  return (
    <section className={styles.section}>
      <div className={styles.portfolioWrap}>
        <div className={styles.servicesHead}>
          <h2>Работы / полноэкранная лента</h2>
          <p>Каждый кейс масштабируется как отдельная сцена, но остается привязан к заявке и продаже.</p>
        </div>
        <div className={styles.portfolioRail}>
          {projects.map((project) => (
            <article
              key={project.id}
              className={`${styles.glassCard} ${styles.portfolioCard}`}
            >
              <span>{project.category}</span>
              <h3>{project.title}</h3>
              <p>{project.summary}</p>
              <p>{project.location}</p>
              <div>
                <Link className={styles.btnPrimary} href={`/portfolio/${project.slug}`}>
                  Смотреть проект
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
