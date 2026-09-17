/**
 * Bestellungen – die Geschäftslogik hinter Webhook, Status-Seite und Admin.
 * Alles hier ist serverseitig; die Routen bleiben dünn.
 */
import { eq, desc } from 'drizzle-orm';
import type Stripe from 'stripe';
import { randomBytes } from 'node:crypto';
import { getDb, hasDb, schema } from './db';
import type { Order, OrderItem, OrderStatus, OrderAddress } from './db/schema';
import { getStripe } from './stripe';
import { isValidConfig, resolveBuild, buildLabel, computePrice } from '$lib/pricing';

const { orders, stripeEvents } = schema;

/** Lesbare Bestellnummer ohne verwechselbare Zeichen (0/O, 1/I) */
function orderId(): string {
	const alphabet = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
	const bytes = randomBytes(6);
	let s = 'SF-';
	for (const b of bytes) s += alphabet[b % alphabet.length];
	return s;
}

function accessToken(): string {
	return randomBytes(18).toString('base64url');
}

/**
 * Webhook-Kern: Event-ID zuerst eintragen. Schlägt das fehl (Primärschlüssel
 * existiert), wurde das Event schon verarbeitet → nichts tun. So ist der
 * Handler idempotent, auch wenn Stripe dasselbe Event dreimal schickt.
 */
export async function markEventProcessed(event: Stripe.Event): Promise<boolean> {
	const db = getDb();
	const inserted = await db
		.insert(stripeEvents)
		.values({ id: event.id, type: event.type })
		.onConflictDoNothing()
		.returning({ id: stripeEvents.id });
	return inserted.length > 0;
}

/** Markierung zurücknehmen, wenn die Verarbeitung scheitert – sonst würde Stripes Retry ins Leere laufen */
export async function unmarkEvent(eventId: string): Promise<void> {
	await getDb().delete(stripeEvents).where(eq(stripeEvents.id, eventId));
}

/** Bestellung aus einer abgeschlossenen Checkout-Session anlegen */
export async function createOrderFromSession(sessionId: string): Promise<Order> {
	const db = getDb();

	// Session mit Line-Items holen – die Konfiguration liegt in product_data.metadata
	const session = await getStripe().checkout.sessions.retrieve(sessionId, {
		expand: ['line_items.data.price.product', 'payment_intent']
	});

	const items: OrderItem[] = (session.line_items?.data ?? []).map((li) => {
		const product = li.price?.product as Stripe.Product | undefined;
		const meta = (product?.metadata ?? {}) as Record<string, string>;
		// Gravur kann fehlen (leere Werte werden beim Checkout weggelassen)
		const config = { engraving: '', ...meta };
		if (!isValidConfig(config)) {
			throw new Error(`Line-Item ohne gültige Konfiguration in Session ${sessionId}`);
		}
		const build = resolveBuild(config);
		return {
			config,
			qty: li.quantity ?? 1,
			label: buildLabel(build),
			unitCents: computePrice(build).total
		};
	});

	const addr = session.collected_information?.shipping_details?.address ?? null;
	const shipping: OrderAddress | null = addr
		? {
				name: session.collected_information?.shipping_details?.name ?? null,
				line1: addr.line1 ?? null,
				line2: addr.line2 ?? null,
				postalCode: addr.postal_code ?? null,
				city: addr.city ?? null,
				country: addr.country ?? null
			}
		: null;

	const paymentIntent =
		typeof session.payment_intent === 'string'
			? session.payment_intent
			: (session.payment_intent?.id ?? null);

	const [order] = await db
		.insert(orders)
		.values({
			id: orderId(),
			stripeSessionId: session.id,
			stripePaymentIntent: paymentIntent,
			accessToken: accessToken(),
			status: 'paid',
			email: session.customer_details?.email ?? null,
			customerName: session.customer_details?.name ?? null,
			amountCents: session.amount_total ?? 0,
			currency: (session.currency ?? 'eur').toUpperCase(),
			items,
			shipping
		})
		.onConflictDoNothing({ target: orders.stripeSessionId })
		.returning();

	// Bereits vorhanden (z. B. zweiter Event-Typ für dieselbe Session) → bestehende zurückgeben
	if (!order) {
		const [existing] = await db.select().from(orders).where(eq(orders.stripeSessionId, session.id));
		return existing;
	}
	return order;
}

/** Status-Seite: nur mit passendem Token */
export async function getOrderForCustomer(id: string, token: string): Promise<Order | null> {
	if (!hasDb()) return null;
	const [order] = await getDb().select().from(orders).where(eq(orders.id, id));
	if (!order || order.accessToken !== token) return null;
	return order;
}

/** Bestätigungsseite: Bestellung zur Session finden (kann noch fehlen, wenn der Webhook hinterherhinkt) */
export async function getOrderBySession(sessionId: string): Promise<Order | null> {
	if (!hasDb()) return null;
	const [order] = await getDb().select().from(orders).where(eq(orders.stripeSessionId, sessionId));
	return order ?? null;
}

export async function listOrders(limit = 100): Promise<Order[]> {
	return getDb().select().from(orders).orderBy(desc(orders.createdAt)).limit(limit);
}

export async function updateOrder(
	id: string,
	patch: { status?: OrderStatus; trackingNumber?: string; trackingUrl?: string; note?: string }
): Promise<Order | null> {
	const [order] = await getDb()
		.update(orders)
		.set({ ...patch, updatedAt: new Date() })
		.where(eq(orders.id, id))
		.returning();
	return order ?? null;
}

export const STATUS_LABEL: Record<OrderStatus, string> = {
	paid: 'Bezahlt',
	building: 'Wird gebaut',
	shipped: 'Versendet',
	delivered: 'Zugestellt',
	cancelled: 'Storniert'
};

/** Reihenfolge für die Timeline auf der Status-Seite */
export const STATUS_FLOW: OrderStatus[] = ['paid', 'building', 'shipped', 'delivered'];
