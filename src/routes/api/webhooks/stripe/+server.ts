/**
 * POST /api/webhooks/stripe
 * Empfängt Stripe-Events, verifiziert die Signatur, legt Bestellungen an.
 *
 * Der Raw-Body muss unverändert an `constructEvent` gehen – deshalb
 * `request.text()` und nicht `request.json()`.
 *
 * Idempotenz: Stripe schickt Events bei Timeouts erneut. Die Event-ID wird
 * VOR der Verarbeitung in stripe_events eingetragen; existiert sie schon,
 * antworten wir 200 und tun nichts. Ohne Datenbank (DATABASE_URL fehlt)
 * loggt der Handler nur – die Demo läuft dann mit Stripe als Order-System.
 *
 * Lokal testen:  stripe listen --forward-to localhost:5174/api/webhooks/stripe
 */
import { json, error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { getStripe } from '$lib/server/stripe';
import { hasDb } from '$lib/server/db';
import { markEventProcessed, unmarkEvent, createOrderFromSession } from '$lib/server/orders';
import { sendOrderConfirmation } from '$lib/server/email';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, url }) => {
	const signature = request.headers.get('stripe-signature');
	const secret = env.STRIPE_WEBHOOK_SECRET?.trim();
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

	if (event.type !== 'checkout.session.completed') {
		return json({ received: true, ignored: event.type });
	}

	const session = event.data.object;
	console.log(
		`[order] ${session.id} · ${session.customer_details?.email ?? '–'} · ` +
			`${((session.amount_total ?? 0) / 100).toFixed(2)} ${session.currency?.toUpperCase()} · ` +
			`${session.payment_status}`
	);

	if (!hasDb()) {
		return json({ received: true, persisted: false });
	}

	try {
		const fresh = await markEventProcessed(event);
		if (!fresh) return json({ received: true, duplicate: true });

		const order = await createOrderFromSession(session.id);
		// Mail darf fehlschlagen, ohne dass Stripe das Event wiederholt – aber awaiten,
		// sonst beendet die Serverless-Function den Prozess vor dem Versand
		await sendOrderConfirmation(order, url.origin).catch((e) => console.error('[mail]', e));
		return json({ received: true, orderId: order.id });
	} catch (err) {
		// Markierung zurücknehmen, dann 500 → Stripe wiederholt das Event später
		console.error('[order] Anlegen fehlgeschlagen:', err);
		await unmarkEvent(event.id).catch(() => {});
		error(500, 'Bestellung konnte nicht angelegt werden');
	}
};
