CREATE TABLE IF NOT EXISTS "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clerk_id" text UNIQUE NOT NULL,
	"email" varchar(255) UNIQUE NOT NULL,
	"name" varchar(255),
	"role" varchar(50) DEFAULT 'employee',
	"company_name" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "clerk_id_idx" ON "users" ("clerk_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "email_idx" ON "users" ("email");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "purchase_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"request_number" varchar(50) UNIQUE NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"department" varchar(100) NOT NULL,
	"priority" varchar(20) DEFAULT 'medium',
	"estimated_budget" integer NOT NULL,
	"status" varchar(50) DEFAULT 'draft',
	"requested_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "request_number_idx" ON "purchase_requests" ("request_number");
--> statement-breakpoint
CREATE UNIQUE INDEX "department_idx" ON "purchase_requests" ("department");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_type" varchar(50) NOT NULL,
	"entity_id" uuid NOT NULL,
	"action" varchar(50) NOT NULL,
	"performed_by" uuid NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "entity_type_id_idx" ON "audit_logs" ("entity_type","entity_id");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "rfqs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"rfq_number" varchar(50) UNIQUE NOT NULL,
	"purchase_request_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"status" varchar(50) DEFAULT 'draft',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "rfq_number_idx" ON "rfqs" ("rfq_number");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "vendor_quotes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"rfq_id" uuid NOT NULL,
	"vendor_id" uuid NOT NULL,
	"price" integer NOT NULL,
	"delivery_time" integer,
	"warranty" varchar(255),
	"notes" text,
	"status" varchar(50) DEFAULT 'submitted',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "purchase_requests" ADD CONSTRAINT "purchase_requests_requested_by_users_id_fk" FOREIGN KEY ("requested_by") REFERENCES "users"("id") ON DELETE cascade;
--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_performed_by_users_id_fk" FOREIGN KEY ("performed_by") REFERENCES "users"("id") ON DELETE set null;
--> statement-breakpoint
ALTER TABLE "rfqs" ADD CONSTRAINT "rfqs_purchase_request_id_purchase_requests_id_fk" FOREIGN KEY ("purchase_request_id") REFERENCES "purchase_requests"("id") ON DELETE cascade;
--> statement-breakpoint
ALTER TABLE "vendor_quotes" ADD CONSTRAINT "vendor_quotes_rfq_id_rfqs_id_fk" FOREIGN KEY ("rfq_id") REFERENCES "rfqs"("id") ON DELETE cascade;
--> statement-breakpoint
ALTER TABLE "vendor_quotes" ADD CONSTRAINT "vendor_quotes_vendor_id_users_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "users"("id") ON DELETE cascade;
