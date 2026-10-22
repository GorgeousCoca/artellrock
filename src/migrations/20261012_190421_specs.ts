import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_materials_formats" AS ENUM('N', 'N+', 'J', 'J+');
  CREATE TYPE "public"."enum_materials_thicknesses_mm" AS ENUM('12', '15', '20', '30');
  CREATE TYPE "public"."enum_materials_finish" AS ENUM('polished', 'matte');
  CREATE TABLE "materials_formats" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_materials_formats",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "materials_thicknesses_mm" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_materials_thicknesses_mm",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  ALTER TABLE "materials" ADD COLUMN "finish" "enum_materials_finish";
  ALTER TABLE "sinks" ADD COLUMN "description" varchar;
  ALTER TABLE "materials_formats" ADD CONSTRAINT "materials_formats_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."materials"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "materials_thicknesses_mm" ADD CONSTRAINT "materials_thicknesses_mm_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."materials"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "materials_formats_order_idx" ON "materials_formats" USING btree ("order");
  CREATE INDEX "materials_formats_parent_idx" ON "materials_formats" USING btree ("parent_id");
  CREATE INDEX "materials_thicknesses_mm_order_idx" ON "materials_thicknesses_mm" USING btree ("order");
  CREATE INDEX "materials_thicknesses_mm_parent_idx" ON "materials_thicknesses_mm" USING btree ("parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "materials_formats" CASCADE;
  DROP TABLE "materials_thicknesses_mm" CASCADE;
  ALTER TABLE "materials" DROP COLUMN "finish";
  ALTER TABLE "sinks" DROP COLUMN "description";
  DROP TYPE "public"."enum_materials_formats";
  DROP TYPE "public"."enum_materials_thicknesses_mm";
  DROP TYPE "public"."enum_materials_finish";`)
}
