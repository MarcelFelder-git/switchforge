/**
 * Bestellbestätigung. Holt die Session serverseitig bei Stripe – die
 * session_id in der URL ist kein Geheimnis, aber ohne Secret Key kann
 * niemand damit Daten abrufen.
 */
import { error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { getStripe } from '$lib/server/stripe';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const sessionId = url.searchParams.get('session_id');
	if (!sessionId) error(400, 'Keine Session-ID');
	if (!env.STRIPE_SECRET_KEY) error(503, 'Stripe ist nicht konfiguriert');

	const session = await getStripe()
		.checkout.sessions.retrieve(sessionId, { expand: ['line_items'] })
		.catch(() => null);
	if (!session) error(404, 'Bestellung nicht gefunden');

	return {
		orderId: session.id,
		paid: session.payment_status === 'paid',
		email: session.customer_details?.email ?? null,
		name: session.customer_details?.name ?? null,
		amountCents: session.amount_total ?? 0,
		currency: (session.currency ?? 'eur').toUpperCase(),
		items:
			session.line_items?.data.map((li) => ({
				name: li.description ?? 'Keyboard',
				qty: li.quantity ?? 1,
				amountCents: li.amount_total
			})) ?? []
	};
};
