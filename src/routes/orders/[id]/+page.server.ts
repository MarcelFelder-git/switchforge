/**
 * Bestellstatus für Kunden – kein Account, nur Bestellnummer + Token aus der Mail.
 * Ein falscher Token sieht dasselbe 404 wie eine nicht existierende Nummer.
 */
import { error } from '@sveltejs/kit';
import { hasDb } from '$lib/server/db';
import { getOrderForCustomer, STATUS_LABEL, STATUS_FLOW } from '$lib/server/orders';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, url }) => {
	if (!hasDb()) error(503, 'Bestellstatus ist in dieser Demo nicht aktiviert (keine Datenbank).');

	const token = url.searchParams.get('t') ?? '';
	const order = await getOrderForCustomer(params.id, token);
	if (!order) error(404, 'Bestellung nicht gefunden');

	return {
		order: {
			id: order.id,
			status: order.status,
			statusLabel: STATUS_LABEL[order.status],
			flow: STATUS_FLOW.map((s) => ({ id: s, label: STATUS_LABEL[s] })),
			customerName: order.customerName,
			email: order.email,
			amountCents: order.amountCents,
			items: order.items,
			shipping: order.shipping,
			trackingNumber: order.trackingNumber,
			trackingUrl: order.trackingUrl,
			createdAt: order.createdAt.toISOString(),
			updatedAt: order.updatedAt.toISOString()
		}
	};
};
