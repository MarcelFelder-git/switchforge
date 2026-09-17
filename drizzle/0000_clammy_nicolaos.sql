CREATE TYPE "public"."order_status" AS ENUM('paid', 'building', 'shipped', 'delivered', 'cancelled');--> statement-breakpoint
CREATE TABLE "orders" (
	"id" text PRIMARY KEY NOT NULL,
	"stripe_session_id" text NOT NULL,
	"stripe_payment_intent" text,
	"access_token" text NOT NULL,
	"status" "order_status" DEFAULT 'paid' NOT NULL,
	"email" text,
	"customer_name" text,
	"amount_cents" integer NOT NULL,
	"currency" text NOT NULL,
	"items" jsonb NOT NULL,
	"shipping" jsonb,
	"tracking_number" text,
	"tracking_url" text,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "orders_stripe_session_id_unique" UNIQUE("stripe_session_id")
);
--> statement-breakpoint
CREATE TABLE "stripe_events" (
	"id" text PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"processed_at" timestamp with time zone DEFAULT now() NOT NULL
);
