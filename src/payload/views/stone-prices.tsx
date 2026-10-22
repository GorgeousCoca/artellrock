import { DefaultTemplate } from "@payloadcms/next/templates";
import { redirect } from "next/navigation";
import type { AdminViewServerProps } from "payload";

import { StonePricesClient } from "./stone-prices-client";

/**
 * Страница админки «Цены на камни» (`/admin/stone-prices`): цены по брендам, пакетные действия и сводка перед
 * сохранением. Серверная обёртка Payload (шаблон админки, проверка входа), вся работа — в клиентском компоненте.
 * Данные читает и пишет через REST: чтение `/api/materials`, запись `POST /api/materials/bulk-prices`.
 */
export function StonePricesView({ initPageResult, params, searchParams }: AdminViewServerProps) {
  const { req, locale, permissions, visibleEntities } = initPageResult;
  // Payload и сам не пускает аноним в админку; проверка здесь — страховка для случая смены настроек маршрутов.
  if (!req.user) redirect("/admin/login");

  return (
    <DefaultTemplate
      i18n={req.i18n}
      locale={locale}
      params={params}
      payload={req.payload}
      permissions={permissions}
      searchParams={searchParams}
      user={req.user ?? undefined}
      visibleEntities={visibleEntities}
    >
      <div className="gutter--left gutter--right">
        <StonePricesClient />
      </div>
    </DefaultTemplate>
  );
}
