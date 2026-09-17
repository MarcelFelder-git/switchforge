/**
 * Datenbank-Schema (Drizzle, Postgres/Neon).
 *
 * Zwei Tabellen reichen für einen echten kleinen Shop:
 * - orders:        eine Zeile pro bezahlter Checkout-Session
 * - stripe_events: verarbeitete Event-IDs → Webhook ist idempotent
 *   (Stripe schickt Events bei Timeouts erneut; ohne diese Tabelle
 *   gäbe es die Bestellung doppelt)
 *
 * Beträge in Integer-Cent, wie überall im Projekt.
 */
import { pgTable, text, integer, timestamp, jsonb, pgEnum } from 'drizzle-orm/pg-core';
import type { BuildConfig } from '$lib/pricing';

export const orderStatus = pgEnum('order_status', [
	'paid',
	'building',
	'shipped',
	'delivered',
	'cancelled'
]);
export type OrderStatus = (typeof orderStatus.enumValues)[number];

export interface OrderItem {
	config: BuildConfig;
	qty: number;
	label: string;
	unitCents: number;
}

export interface OrderAddress {
	name: string | null;
	line1: string | null;
	line2: string | null;
	postalCode: string | null;
	city: string | null;
	country: string | null;
}

export const orders = pgTable('orders', {
	/** Kurze, lesbare Bestellnummer, z. B. SF-4K7Q2M */
	id: text('id').primaryKey(),
	stripeSessionId: text('stripe_session_id').notNull().unique(),
	stripePaymentIntent: text('stripe_payment_intent'),
	/** Zufallstoken für die Status-Seite – Link in der Mail, kein Account nötig */
	accessToken: text('access_token').notNull(),
	status: orderStatus('status').notNull().default('paid'),
	email: text('email'),
	customerName: text('customer_name'),
	amountCents: integer('amount_cents').notNull(),
	currency: text('currency').notNull(),
	items: jsonb('items').$type<OrderItem[]>().notNull(),
	shipping: jsonb('shipping').$type<OrderAddress | null>(),
	trackingNumber: text('tracking_number'),
	trackingUrl: text('tracking_url'),
	/** Interne Notiz aus dem Admin */
	note: text('note'),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
});

export const stripeEvents = pgTable('stripe_events', {
	id: text('id').primaryKey(),
	type: text('type').notNull(),
	processedAt: timestamp('processed_at', { withTimezone: true }).notNull().defaultNow()
});

export type Order = typeof orders.$inferSelect;
