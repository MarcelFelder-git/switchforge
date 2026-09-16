/**
 * POST /api/checkout
 * Erstellt eine Stripe Checkout Session aus dem übergebenen Cart.
 *
 * Wichtig: Preise werden hier serverseitig aus dem Katalog neu berechnet,
 * nie vom Client übernommen – der Client schickt nur Konfigurations-IDs.
 *
 * Wird in Schritt 3 (Cart & Checkout) vollständig implementiert.
 */
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async () => {
	// TODO Schritt 3: Body validieren, BuilderState.load() + price.total pro
	// Line-Item serverseitig rechnen, getStripe().checkout.sessions.create()
	error(501, 'Checkout noch nicht implementiert');
	return json({});
};
