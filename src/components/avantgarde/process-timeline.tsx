"use client";

import styles from "./avantgarde-home.module.scss";

type ProcessTimelineProps = {
  steps: string[];
};

export function ProcessTimeline({ steps }: ProcessTimelineProps) {
  return (
    <section className="section">
      <div className="container">
        <div className={styles.sectionHead}>
          <h2>Как проходит работа</h2>
          <p>Каждый этап фиксируется в одном контексте: от первой заявки до аккуратного монтажа.</p>
        </div>
        <div className={styles.workflowList}>
          {steps.map((step) => (
            <div key={step} className={styles.workflowItem}>
              <p>{step}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
