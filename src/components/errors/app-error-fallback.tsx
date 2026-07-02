"use client";

import Link from "next/link";

type AppErrorFallbackProps = {
  title: string;
  description: string;
  reset?: () => void;
  eyebrow?: string;
};

export function AppErrorFallback({ title, description, reset, eyebrow = "Сбой" }: AppErrorFallbackProps) {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "clamp(40px, 8vw, 80px) 24px",
        background: "#F2F0EB"
      }}
    >
      <div style={{ maxWidth: 520, width: "100%" }}>
        <div
          style={{
            background: "#FFFFFF",
            borderRadius: "18px",
            boxShadow: "0 4px 24px rgba(0,0,0,0.07)",
            padding: "clamp(28px, 5vw, 48px)",
            textAlign: "center",
            border: "1px solid rgba(26,26,26,0.08)"
          }}
        >
          <span
            style={{
              display: "inline-block",
              padding: "4px 12px",
              borderRadius: "999px",
              background: "rgba(92,82,71,0.08)",
              color: "#5C5247",
              fontSize: "0.75rem",
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              marginBottom: "16px"
            }}
          >
            {eyebrow}
          </span>
          <h1
            style={{
              margin: "0 0 12px",
              fontSize: "clamp(1.4rem, 4vw, 1.9rem)",
              fontWeight: 700,
              letterSpacing: "-0.02em",
              lineHeight: 1.15,
              color: "#1A1A1A"
            }}
          >
            {title}
          </h1>
          <p
            style={{
              color: "#6B7280",
              margin: "0 0 28px",
              lineHeight: 1.65,
              fontSize: "1rem"
            }}
          >
            {description}
          </p>
          <div
            style={{
              display: "flex",
              gap: "10px",
              justifyContent: "center",
              flexWrap: "wrap"
            }}
          >
            {reset ? (
              <button
                type="button"
                onClick={() => reset()}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  padding: "12px 24px",
                  borderRadius: "12px",
                  border: "none",
                  background: "#5C5247",
                  color: "#fff",
                  fontWeight: 600,
                  fontSize: "0.9375rem",
                  cursor: "pointer",
                  fontFamily: "inherit"
                }}
              >
                Попробовать снова
              </button>
            ) : null}
            <Link
              href="/"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                padding: "12px 24px",
                borderRadius: "12px",
                border: "1px solid rgba(92,82,71,0.2)",
                background: "transparent",
                color: "#5C5247",
                fontWeight: 600,
                fontSize: "0.9375rem",
                textDecoration: "none"
              }}
            >
              На главную
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
