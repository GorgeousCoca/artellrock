import { MigrateUpArgs, MigrateDownArgs, sql } from "@payloadcms/db-postgres";

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "contact_requests" ADD COLUMN "telegram" varchar;
    ALTER TABLE "contact_requests" ALTER COLUMN "phone" DROP NOT NULL;
  `);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    UPDATE "contact_requests" SET "phone" = '' WHERE "phone" IS NULL;
    ALTER TABLE "contact_requests" ALTER COLUMN "phone" SET NOT NULL;
    ALTER TABLE "contact_requests" DROP COLUMN "telegram";
  `);
}
