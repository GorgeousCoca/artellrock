"use client";

import { useRef, useEffect, useState } from "react";

import styles from "./avantgarde-home.module.scss";

type ProcessTimelineProps = {
  steps: string[];
};

function useTrackInView() {
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
      { threshold: 0.1, rootMargin: "0px 0px -60px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return { ref, inView };
}

export function ProcessTimeline({ steps }: ProcessTimelineProps) {
  const { ref, inView } = useTrackInView();

  return (
    <section className={styles.section}>
      <div className={styles.timelineWrap}>
        <div className={styles.servicesHead}>
          <h2>Как проходит работа</h2>
          <p>Каждый этап фиксируется в центре внимания: от первой заявки до аккуратного монтажа.</p>
        </div>
        <div ref={ref} className={styles.timelineTrack}>
          {steps.map((step, index) => (
            <div key={step} className={styles.timelineItem}>
              <span className={styles.timelineDot} />
              <div
                className={`${styles.glassCard} ${styles.timelineBody} ${inView ? styles.revealed : styles.reveal}`}
                style={{ transitionDelay: inView ? `${index * 0.08}s` : "0s" }}
              >
                <span className={styles.timelineStep}>Step {index + 1}</span>
                <h3>{step}</h3>
                <p>Клиент получает прозрачный прогресс, дедлайны и контроль качества на каждом этапе.</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
