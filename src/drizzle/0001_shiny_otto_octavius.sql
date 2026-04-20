CREATE TABLE "directadmin_config" (
	"id" serial PRIMARY KEY NOT NULL,
	"reseller_username" text NOT NULL,
	"reseller_password" text NOT NULL,
	"server_ip" text NOT NULL,
	"panel_url" text NOT NULL,
	"nameserver_1" text NOT NULL,
	"nameserver_2" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"link" text,
	"is_read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "password_resets" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "password_resets_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "point_transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"wallet_id" integer NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"type" text NOT NULL,
	"description" text,
	"reference_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "slip_verifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"file_hash" text NOT NULL,
	"file_name" text NOT NULL,
	"file_size" integer NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"rdcw_response" text,
	"reference_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "slip_verifications_file_hash_unique" UNIQUE("file_hash")
);
--> statement-breakpoint
CREATE TABLE "system_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"value" text NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "system_settings_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "testimonials" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"name" text NOT NULL,
	"role" text,
	"company" text,
	"content" text NOT NULL,
	"rating" integer DEFAULT 5 NOT NULL,
	"avatar_url" text,
	"image" text,
	"is_approved" boolean DEFAULT false NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wallets" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"balance" numeric(10, 2) DEFAULT '0' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "wallets_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
ALTER TABLE "articles" RENAME TO "hosting_categories";--> statement-breakpoint
ALTER TABLE "payment_methods" RENAME TO "hosting_orders";--> statement-breakpoint
ALTER TABLE "tickets" RENAME TO "hosting_packages";--> statement-breakpoint
ALTER TABLE "hosting_orders" DROP CONSTRAINT "payment_methods_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "hosting_packages" DROP CONSTRAINT "tickets_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "password" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "hosting_categories" ADD COLUMN "name" text NOT NULL;--> statement-breakpoint
ALTER TABLE "hosting_categories" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "hosting_categories" ADD COLUMN "icon" text;--> statement-breakpoint
ALTER TABLE "hosting_categories" ADD COLUMN "config_id" integer;--> statement-breakpoint
ALTER TABLE "hosting_categories" ADD COLUMN "display_order" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "hosting_categories" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "hosting_categories" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "hosting_orders" ADD COLUMN "service_id" integer;--> statement-breakpoint
ALTER TABLE "hosting_orders" ADD COLUMN "package_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "hosting_orders" ADD COLUMN "domain" text NOT NULL;--> statement-breakpoint
ALTER TABLE "hosting_orders" ADD COLUMN "directadmin_username" text NOT NULL;--> statement-breakpoint
ALTER TABLE "hosting_orders" ADD COLUMN "directadmin_password" text NOT NULL;--> statement-breakpoint
ALTER TABLE "hosting_orders" ADD COLUMN "directadmin_email" text NOT NULL;--> statement-breakpoint
ALTER TABLE "hosting_orders" ADD COLUMN "status" text DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "hosting_orders" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "hosting_packages" ADD COLUMN "name" text NOT NULL;--> statement-breakpoint
ALTER TABLE "hosting_packages" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "hosting_packages" ADD COLUMN "category_id" integer;--> statement-breakpoint
ALTER TABLE "hosting_packages" ADD COLUMN "directadmin_package_name" text;--> statement-breakpoint
ALTER TABLE "hosting_packages" ADD COLUMN "config_id" integer;--> statement-breakpoint
ALTER TABLE "hosting_packages" ADD COLUMN "disk_space" text NOT NULL;--> statement-breakpoint
ALTER TABLE "hosting_packages" ADD COLUMN "bandwidth" text NOT NULL;--> statement-breakpoint
ALTER TABLE "hosting_packages" ADD COLUMN "domains" text DEFAULT '1' NOT NULL;--> statement-breakpoint
ALTER TABLE "hosting_packages" ADD COLUMN "subdomains" text DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "hosting_packages" ADD COLUMN "email_accounts" text DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "hosting_packages" ADD COLUMN "databases" text DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "hosting_packages" ADD COLUMN "ftp_accounts" text DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "hosting_packages" ADD COLUMN "price" numeric(10, 2) NOT NULL;--> statement-breakpoint
ALTER TABLE "hosting_packages" ADD COLUMN "billing_cycle" text DEFAULT 'monthly';--> statement-breakpoint
ALTER TABLE "hosting_packages" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "hosting_packages" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "point_transactions" ADD CONSTRAINT "point_transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "point_transactions" ADD CONSTRAINT "point_transactions_wallet_id_wallets_id_fk" FOREIGN KEY ("wallet_id") REFERENCES "public"."wallets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "slip_verifications" ADD CONSTRAINT "slip_verifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "testimonials" ADD CONSTRAINT "testimonials_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hosting_categories" ADD CONSTRAINT "hosting_categories_config_id_directadmin_config_id_fk" FOREIGN KEY ("config_id") REFERENCES "public"."directadmin_config"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hosting_orders" ADD CONSTRAINT "hosting_orders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hosting_orders" ADD CONSTRAINT "hosting_orders_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hosting_orders" ADD CONSTRAINT "hosting_orders_package_id_hosting_packages_id_fk" FOREIGN KEY ("package_id") REFERENCES "public"."hosting_packages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hosting_packages" ADD CONSTRAINT "hosting_packages_category_id_hosting_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."hosting_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hosting_packages" ADD CONSTRAINT "hosting_packages_config_id_directadmin_config_id_fk" FOREIGN KEY ("config_id") REFERENCES "public"."directadmin_config"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hosting_categories" DROP COLUMN "title";--> statement-breakpoint
ALTER TABLE "hosting_categories" DROP COLUMN "content";--> statement-breakpoint
ALTER TABLE "hosting_categories" DROP COLUMN "category";--> statement-breakpoint
ALTER TABLE "hosting_categories" DROP COLUMN "published";--> statement-breakpoint
ALTER TABLE "hosting_orders" DROP COLUMN "type";--> statement-breakpoint
ALTER TABLE "hosting_orders" DROP COLUMN "last_4";--> statement-breakpoint
ALTER TABLE "hosting_orders" DROP COLUMN "brand";--> statement-breakpoint
ALTER TABLE "hosting_orders" DROP COLUMN "expiry_month";--> statement-breakpoint
ALTER TABLE "hosting_orders" DROP COLUMN "expiry_year";--> statement-breakpoint
ALTER TABLE "hosting_orders" DROP COLUMN "is_default";--> statement-breakpoint
ALTER TABLE "hosting_packages" DROP COLUMN "user_id";--> statement-breakpoint
ALTER TABLE "hosting_packages" DROP COLUMN "subject";--> statement-breakpoint
ALTER TABLE "hosting_packages" DROP COLUMN "department";--> statement-breakpoint
ALTER TABLE "hosting_packages" DROP COLUMN "status";--> statement-breakpoint
ALTER TABLE "hosting_packages" DROP COLUMN "priority";--> statement-breakpoint
ALTER TABLE "hosting_packages" DROP COLUMN "last_updated";--> statement-breakpoint
DROP TYPE "public"."ticket_priority";--> statement-breakpoint
DROP TYPE "public"."ticket_status";