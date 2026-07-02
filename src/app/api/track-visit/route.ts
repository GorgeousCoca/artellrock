import { NextRequest, NextResponse } from "next/server";

import { incrementVisit } from "@/lib/analytics";

// Simple in-memory rate limit: 1 request per IP per 30 seconds
const lastVisit = new Map<string, number>();

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = (await req.json()) as { path?: string };
    const pathname = body.path ?? "/";

    // Skip admin and API paths
    if (pathname.startsWith("/admin") || pathname.startsWith("/api")) {
      return NextResponse.json({ ok: true });
    }

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const now = Date.now();
    const last = lastVisit.get(ip) ?? 0;

    if (now - last < 30_000) {
      return NextResponse.json({ ok: true });
    }

    lastVisit.set(ip, now);

    // Clean map periodically to avoid memory leak
    if (lastVisit.size > 5000) {
      const threshold = now - 60_000;
      for (const [key, ts] of lastVisit) {
        if (ts < threshold) lastVisit.delete(key);
      }
    }

    const today = new Date().toISOString().slice(0, 10);
    await incrementVisit(today);

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
