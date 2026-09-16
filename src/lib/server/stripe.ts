/**
 * Server-seitiger Stripe-Client (Secret Key – nie im Browser!).
 * Lazy initialisiert, damit ein fehlender Key erst beim ersten Checkout
 * und nicht schon beim Serverstart knallt.
 */
import Stripe from 'stripe';
import { env } from '$env/dynamic/private';

let client: Stripe | null = null;

export function getStripe(): Stripe {
	if (client) return client;

	const secret = env.STRIPE_SECRET_KEY;
	if (!secret) {
		throw new Error('STRIPE_SECRET_KEY muss in .env gesetzt sein');
	}

	client = new Stripe(secret, {
		appInfo: { name: 'SwitchForge', version: '0.0.1' }
	});
	return client;
}
