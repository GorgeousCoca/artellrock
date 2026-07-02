import fs from "fs/promises";
import path from "path";

import type { VisitStats } from "@/types/content";

const ANALYTICS_PATH = path.join(process.cwd(), "src", "content", "analytics.json");

export async function getVisitStats(): Promise<VisitStats> {
  try {
    const raw = await fs.readFile(ANALYTICS_PATH, "utf-8");
    const data = JSON.parse(raw) as { visits: VisitStats };
    return data.visits ?? {};
  } catch {
    return {};
  }
}

export async function incrementVisit(date: string): Promise<void> {
  let stats: VisitStats = {};
  try {
    const raw = await fs.readFile(ANALYTICS_PATH, "utf-8");
    const data = JSON.parse(raw) as { visits: VisitStats };
    stats = data.visits ?? {};
  } catch {
    // file missing — start fresh
  }

  stats[date] = (stats[date] ?? 0) + 1;

  // Keep only last 90 days
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 90);
  const cutoffStr = cutoff.toISOString().slice(0, 10);
  for (const key of Object.keys(stats)) {
    if (key < cutoffStr) delete stats[key];
  }

  await fs.writeFile(ANALYTICS_PATH, JSON.stringify({ visits: stats }, null, 2), "utf-8");
}

export function getLast30Days(stats: VisitStats): { date: string; count: number }[] {
  const result: { date: string; count: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    result.push({ date: key, count: stats[key] ?? 0 });
  }
  return result;
}

export function sumLast7Days(stats: VisitStats): number {
  let sum = 0;
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    sum += stats[key] ?? 0;
  }
  return sum;
}

export function sumLast30Days(stats: VisitStats): number {
  return getLast30Days(stats).reduce((acc, d) => acc + d.count, 0);
}
