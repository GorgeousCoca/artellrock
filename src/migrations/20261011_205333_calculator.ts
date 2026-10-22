import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_edges_kind" AS ENUM('thickness', 'profile');
  CREATE TYPE "public"."enum_sinks_type" AS ENUM('cutout', 'overmount', 'undermount', 'integrated');
  CREATE TYPE "public"."enum_additional_services_category" AS ENUM('processing', 'measure', 'delivery', 'installation', 'other');
  CREATE TYPE "public"."enum_additional_services_quantity_mode" AS ENUM('user', 'once', 'area', 'perimeter', 'edge', 'backsplash', 'rounded-corners');
  CREATE TYPE "public"."enum_additional_services_unit" AS ENUM('piece', 'meter', 'sqm');
  CREATE TABLE "materials" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"brand" varchar NOT NULL,
  	"name" varchar NOT NULL,
  	"sku" varchar,
  	"shade" varchar,
  	"texture" varchar,
  	"price_per_sqm" numeric DEFAULT 0 NOT NULL,
  	"sheet_length_mm" numeric,
  	"sheet_width_mm" numeric,
  	"image" varchar,
  	"sort_order" numeric DEFAULT 0,
  	"is_active" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "edges" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"kind" "enum_edges_kind" DEFAULT 'profile' NOT NULL,
  	"name" varchar NOT NULL,
  	"thickness_mm" numeric,
  	"price_per_meter" numeric DEFAULT 0 NOT NULL,
  	"image" varchar,
  	"sort_order" numeric DEFAULT 0,
  	"is_active" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "backsplashes" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"height_mm" numeric,
  	"price_per_meter" numeric DEFAULT 0 NOT NULL,
  	"image" varchar,
  	"sort_order" numeric DEFAULT 0,
  	"is_active" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "sinks" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"type" "enum_sinks_type" NOT NULL,
  	"name" varchar NOT NULL,
  	"price" numeric DEFAULT 0 NOT NULL,
  	"image" varchar,
  	"sort_order" numeric DEFAULT 0,
  	"is_active" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "additional_services" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"category" "enum_additional_services_category" DEFAULT 'processing' NOT NULL,
  	"price" numeric DEFAULT 0 NOT NULL,
  	"quantity_mode" "enum_additional_services_quantity_mode" DEFAULT 'user' NOT NULL,
  	"unit" "enum_additional_services_unit" DEFAULT 'piece',
  	"auto_apply" boolean DEFAULT false,
  	"hint" varchar,
  	"sort_order" numeric DEFAULT 0,
  	"is_active" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "contact_requests" ADD COLUMN "estimate_total" numeric;
  ALTER TABLE "contact_requests" ADD COLUMN "estimate" jsonb;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "materials_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "edges_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "backsplashes_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "sinks_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "additional_services_id" integer;
  CREATE INDEX "materials_brand_idx" ON "materials" USING btree ("brand");
  CREATE INDEX "materials_sku_idx" ON "materials" USING btree ("sku");
  CREATE INDEX "materials_shade_idx" ON "materials" USING btree ("shade");
  CREATE INDEX "materials_texture_idx" ON "materials" USING btree ("texture");
  CREATE INDEX "materials_is_active_idx" ON "materials" USING btree ("is_active");
  CREATE INDEX "materials_updated_at_idx" ON "materials" USING btree ("updated_at");
  CREATE INDEX "materials_created_at_idx" ON "materials" USING btree ("created_at");
  CREATE INDEX "edges_kind_idx" ON "edges" USING btree ("kind");
  CREATE INDEX "edges_is_active_idx" ON "edges" USING btree ("is_active");
  CREATE INDEX "edges_updated_at_idx" ON "edges" USING btree ("updated_at");
  CREATE INDEX "edges_created_at_idx" ON "edges" USING btree ("created_at");
  CREATE INDEX "backsplashes_is_active_idx" ON "backsplashes" USING btree ("is_active");
  CREATE INDEX "backsplashes_updated_at_idx" ON "backsplashes" USING btree ("updated_at");
  CREATE INDEX "backsplashes_created_at_idx" ON "backsplashes" USING btree ("created_at");
  CREATE INDEX "sinks_type_idx" ON "sinks" USING btree ("type");
  CREATE INDEX "sinks_is_active_idx" ON "sinks" USING btree ("is_active");
  CREATE INDEX "sinks_updated_at_idx" ON "sinks" USING btree ("updated_at");
  CREATE INDEX "sinks_created_at_idx" ON "sinks" USING btree ("created_at");
  CREATE INDEX "additional_services_category_idx" ON "additional_services" USING btree ("category");
  CREATE INDEX "additional_services_is_active_idx" ON "additional_services" USING btree ("is_active");
  CREATE INDEX "additional_services_updated_at_idx" ON "additional_services" USING btree ("updated_at");
  CREATE INDEX "additional_services_created_at_idx" ON "additional_services" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_materials_fk" FOREIGN KEY ("materials_id") REFERENCES "public"."materials"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_edges_fk" FOREIGN KEY ("edges_id") REFERENCES "public"."edges"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_backsplashes_fk" FOREIGN KEY ("backsplashes_id") REFERENCES "public"."backsplashes"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_sinks_fk" FOREIGN KEY ("sinks_id") REFERENCES "public"."sinks"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_additional_services_fk" FOREIGN KEY ("additional_services_id") REFERENCES "public"."additional_services"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_materials_id_idx" ON "payload_locked_documents_rels" USING btree ("materials_id");
  CREATE INDEX "payload_locked_documents_rels_edges_id_idx" ON "payload_locked_documents_rels" USING btree ("edges_id");
  CREATE INDEX "payload_locked_documents_rels_backsplashes_id_idx" ON "payload_locked_documents_rels" USING btree ("backsplashes_id");
  CREATE INDEX "payload_locked_documents_rels_sinks_id_idx" ON "payload_locked_documents_rels" USING btree ("sinks_id");
  CREATE INDEX "payload_locked_documents_rels_additional_services_id_idx" ON "payload_locked_documents_rels" USING btree ("additional_services_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "materials" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "edges" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "backsplashes" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "sinks" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "additional_services" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "materials" CASCADE;
  DROP TABLE "edges" CASCADE;
  DROP TABLE "backsplashes" CASCADE;
  DROP TABLE "sinks" CASCADE;
  DROP TABLE "additional_services" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_materials_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_edges_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_backsplashes_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_sinks_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_additional_services_fk";
  
  DROP INDEX "payload_locked_documents_rels_materials_id_idx";
  DROP INDEX "payload_locked_documents_rels_edges_id_idx";
  DROP INDEX "payload_locked_documents_rels_backsplashes_id_idx";
  DROP INDEX "payload_locked_documents_rels_sinks_id_idx";
  DROP INDEX "payload_locked_documents_rels_additional_services_id_idx";
  ALTER TABLE "contact_requests" DROP COLUMN "estimate_total";
  ALTER TABLE "contact_requests" DROP COLUMN "estimate";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "materials_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "edges_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "backsplashes_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "sinks_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "additional_services_id";
  DROP TYPE "public"."enum_edges_kind";
  DROP TYPE "public"."enum_sinks_type";
  DROP TYPE "public"."enum_additional_services_category";
  DROP TYPE "public"."enum_additional_services_quantity_mode";
  DROP TYPE "public"."enum_additional_services_unit";`)
}
