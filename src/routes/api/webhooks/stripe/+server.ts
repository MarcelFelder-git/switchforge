/**
 * POST /api/webhooks/stripe
 * Empfängt Stripe-Events und verifiziert die Signatur.
 *
 * Der Raw-Body muss unverändert an `constructEvent` gehen – deshalb
 * `request.text()` und nicht `request.json()`.
 *
 * Wird in Schritt 3 (Cart & Checkout) vollständig implementiert.
 */
import { json, error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { getStripe } from '$lib/server/stripe';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const signature = request.headers.get('stripe-signature');
	const secret = env.STRIPE_WEBHOOK_SECRET;
	if (!signature || !secret) {
		error(400, 'Fehlende Stripe-Signatur oder Webhook-Secret');
	}

	const payload = await request.text();

	let event;
	try {
		event = getStripe().webhooks.constructEvent(payload, signature, secret);
	} catch (err) {
		console.error('Stripe-Webhook: ungültige Signatur', err);
		error(400, 'Ungültige Signatur');
	}

	switch (event.type) {
		case 'checkout.session.completed':
			// TODO Schritt 3: Bestellung in Supabase als "paid" markieren
			break;
		default:
			break;
	}

	return json({ received: true });
};
