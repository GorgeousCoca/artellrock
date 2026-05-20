import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { adminCollections, type AdminCollectionKey } from "@/lib/admin/config";
import { isAdminAuthorized } from "@/lib/admin/auth";
import { deleteItem, updateItem } from "@/lib/cms/store";
import { withApiErrorHandling } from "@/lib/server/with-api-error-handling";

type RouteContext = {
  params: Promise<{ collection: string; id: string }>;
};

function isCollectionKey(value: string): value is AdminCollectionKey {
  return value in adminCollections;
}

export const PATCH = withApiErrorHandling(async (request: NextRequest, context: RouteContext) => {
  if (!(await isAdminAuthorized())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { collection, id } = await context.params;

  if (!isCollectionKey(collection)) {
    return NextResponse.json({ error: "Unknown collection" }, { status: 404 });
  }

  const body = await request.json();
  const item = await updateItem(collection, id, body);
  return NextResponse.json(item);
});

export const DELETE = withApiErrorHandling(async (_: NextRequest, context: RouteContext) => {
  if (!(await isAdminAuthorized())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { collection, id } = await context.params;

  if (!isCollectionKey(collection)) {
    return NextResponse.json({ error: "Unknown collection" }, { status: 404 });
  }

  await deleteItem(collection, id);
  return NextResponse.json({ ok: true });
});
