import { defineTheme } from "@astryxdesign/core/theme";

import { themes } from "@/astryx-themes";

/**
 * Нейтральная тема Astryx, подогнанная под палитру и шрифт мастерской.
 * Оборачивает отдельные блоки, шапка сайта остаётся на своих стилях.
 */
export const artellrockTheme = defineTheme({
  name: "artellrock",
  extends: themes.neutral,
  typography: {
    scale: { base: 17, ratio: 1.2 },
    body: {
      family: "SF Pro Text",
      fallbacks: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
    },
    heading: {
      family: "SF Pro Display",
      fallbacks: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
      weight: "semibold",
      weights: { 2: "semibold", 3: "semibold" }
    },
    code: {
      family: "ui-monospace",
      fallbacks: '"SF Mono", Monaco, Consolas, monospace'
    }
  },
  tokens: {
    "--color-background-body": "#f9f8f6",
    "--color-background-surface": "#ffffff",
    "--color-background-card": "#ffffff",
    "--color-background-muted": "#efebe4",
    "--color-text-primary": "#111111",
    "--color-text-secondary": "#6d6a66",
    "--color-border": "#e4dfd6",
    "--color-accent": "#111111",
    "--color-on-accent": "#f9f8f6",
    "--radius-container": "18px",
    "--radius-element": "11px"
  }
});
