"use client";

import Link from "next/link";

type AppErrorFallbackProps = {
  title: string;
  description: string;
  reset?: () => void;
  eyebrow?: string;
};

/**
 * Standalone fallback (no async Server Components) for error boundaries and global-error.
 */
export function AppErrorFallback({ title, description, reset, eyebrow = "Сбой" }: AppErrorFallbackProps) {
  return (
    <div
      className="app-error-fallback"
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "var(--section-pad-y) var(--space-5)",
        background:
          "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(211, 170, 103, 0.2), transparent), linear-gradient(180deg, #0a1018 0%, #121b28 100%)"
      }}
    >
      <div className="container" style={{ maxWidth: 520, width: "100%" }}>
        <div
          className="card stack"
          style={{
            textAlign: "center",
            padding: "clamp(28px, 5vw, 40px)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            boxShadow: "0 32px 80px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.06)",
            background: "linear-gradient(165deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 100%)"
          }}
        >
          <span className="eyebrow" style={{ color: "rgba(255, 200, 160, 0.95)" }}>
            {eyebrow}
          </span>
          <h1
            style={{
              margin: "var(--space-3) 0 var(--space-4)",
              fontSize: "clamp(1.35rem, 4vw, 1.75rem)",
              lineHeight: "var(--leading-heading)",
              letterSpacing: "-0.02em"
            }}
          >
            {title}
          </h1>
          <p style={{ color: "var(--foreground-soft)", margin: "0 0 var(--space-6)", lineHeight: "var(--leading-body)" }}>
            {description}
          </p>
          <div className="btn-row" style={{ justifyContent: "center", flexWrap: "wrap", gap: "var(--space-3)" }}>
            {reset ? (
              <button type="button" className="button" onClick={() => reset()}>
                Попробовать снова
              </button>
            ) : null}
            <Link className={reset ? "button-secondary" : "button"} href="/">
              На главную
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
