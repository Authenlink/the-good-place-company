CREATE TABLE "areas" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "areas_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "company_values" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "company_values_name_unique" UNIQUE("name")
);
--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "background" text;--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "area_id" integer;--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "values" jsonb;--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "email" text;--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "phone" text;--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "address" text;--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "website" text;--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "founded" text;--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN "size" text;--> statement-breakpoint
ALTER TABLE "companies" ADD CONSTRAINT "companies_area_id_areas_id_fk" FOREIGN KEY ("area_id") REFERENCES "public"."areas"("id") ON DELETE no action ON UPDATE no action;