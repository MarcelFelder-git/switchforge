/**
 * POST /api/webhooks/stripe
 * Empfängt Stripe-Events und verifiziert die Signatur.
 *
 * Der Raw-Body muss unverändert an `constructEvent` gehen – deshalb
 * `request.text()` und nicht `request.json()`.
 *
 * Ohne Datenbank ist Stripe selbst das "Order-System": Die Session enthält
 * Konfiguration (metadata), Betrag, Adresse und Zahlungsstatus. Hier wäre
 * der Ort für Folgeaktionen (Bestätigungs-Mail, Fulfillment-Ticket).
 *
 * Lokal testen:  stripe listen --forward-to localhost:5174/api/webhooks/stripe
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
		case 'checkout.session.completed': {
			const session = event.data.object;
			console.log(
				`[order] ${session.id} · ${session.customer_details?.email ?? '–'} · ` +
					`${((session.amount_total ?? 0) / 100).toFixed(2)} ${session.currency?.toUpperCase()} · ` +
					`${session.payment_status}`
			);
			// TODO: Bestätigungs-Mail (z. B. Resend, Free-Tier) – bewusst noch nicht,
			// bis eine Absender-Domain feststeht.
			break;
		}
		case 'checkout.session.expired':
			console.log(`[order] Session abgelaufen: ${event.data.object.id}`);
			break;
		default:
			break;
	}

	return json({ received: true });
};
