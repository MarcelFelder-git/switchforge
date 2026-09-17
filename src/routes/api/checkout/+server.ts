/**
 * POST /api/checkout
 * Erstellt eine Stripe Checkout Session aus dem übergebenen Cart.
 *
 * Sicherheitsprinzip: Der Client schickt NUR Konfigurations-IDs und Mengen.
 * Preise werden hier aus dem Katalog neu berechnet (dieselbe pricing.ts
 * wie im Browser). Wer den Request manipuliert, bekommt trotzdem den
 * echten Preis.
 */
import { json, error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { getStripe } from '$lib/server/stripe';
import { CURRENCY } from '$lib/data/catalog';
import {
	isValidConfig,
	resolveBuild,
	computePrice,
	buildLabel,
	buildDescription
} from '$lib/pricing';
import type { RequestHandler } from './$types';

const MAX_ITEMS = 20;
const MAX_QTY = 10;

export const POST: RequestHandler = async ({ request, url }) => {
	if (!env.STRIPE_SECRET_KEY) {
		error(503, 'Stripe ist nicht konfiguriert (STRIPE_SECRET_KEY fehlt in .env).');
	}

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		error(400, 'Ungültiger JSON-Body');
	}

	const items = (body as { items?: unknown })?.items;
	if (!Array.isArray(items) || items.length === 0 || items.length > MAX_ITEMS) {
		error(400, 'Cart ist leer oder ungültig');
	}

	const lineItems = items.map((raw) => {
		const { config, qty } = (raw ?? {}) as { config?: unknown; qty?: unknown };
		if (!isValidConfig(config)) error(400, 'Unbekannte Konfiguration');
		if (!Number.isInteger(qty) || (qty as number) < 1 || (qty as number) > MAX_QTY) {
			error(400, 'Ungültige Menge');
		}

		const build = resolveBuild(config);
		const price = computePrice(build);

		return {
			quantity: qty as number,
			price_data: {
				currency: CURRENCY.toLowerCase(),
				unit_amount: price.total,
				product_data: {
					name: buildLabel(build),
					description: buildDescription(build),
					// Konfiguration landet in Stripe – die "Bestellung" ist damit vollständig
					// im Dashboard nachvollziehbar, ohne eigene Datenbank.
					// Leere Werte weglassen: Stripe interpretiert "" als "Key löschen"
					metadata: Object.fromEntries(
						Object.entries(config).filter(([, v]) => typeof v === 'string' && v !== '')
					)
				}
			}
		};
	});

	try {
		const session = await getStripe().checkout.sessions.create({
			mode: 'payment',
			line_items: lineItems,
			locale: 'de',
			shipping_address_collection: { allowed_countries: ['DE', 'AT', 'CH'] },
			success_url: `${url.origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
			cancel_url: `${url.origin}/?checkout=cancelled`,
			metadata: { source: 'switchforge' }
		});
		if (!session.url) error(502, 'Stripe hat keine Checkout-URL geliefert');
		return json({ url: session.url });
	} catch (err) {
		// Stripe-Fehler sichtbar machen statt anonymer 500 – die Meldung landet im Drawer
		if (err && typeof err === 'object' && 'status' in err && 'body' in err) throw err; // SvelteKit-HttpError
		const message = err instanceof Error ? err.message : String(err);
		console.error('[checkout] Stripe-Fehler:', message);
		error(502, `Stripe: ${message}`);
	}
};
