/**
 * Mini-Admin: Bestellliste, Status ändern, Tracking eintragen.
 * Form Actions statt API – kein Client-JS nötig, funktioniert auch ohne Hydration.
 */
import { fail } from '@sveltejs/kit';
import { hasDb } from '$lib/server/db';
import { adminEnabled, checkPassword, isAdmin, login, logout } from '$lib/server/admin';
import { listOrders, updateOrder, STATUS_LABEL } from '$lib/server/orders';
import { sendStatusUpdate } from '$lib/server/email';
import type { OrderStatus } from '$lib/server/db/schema';
import type { PageServerLoad, Actions } from './$types';

const STATUSES = Object.keys(STATUS_LABEL) as OrderStatus[];

export const load: PageServerLoad = async ({ cookies }) => {
	const enabled = adminEnabled() && hasDb();
	const authed = enabled && isAdmin(cookies);
	if (!authed)
		return {
			enabled,
			authed: false,
			orders: [],
			statuses: [] as { id: OrderStatus; label: string }[]
		};

	const orders = (await listOrders()).map((o) => ({
		id: o.id,
		status: o.status,
		email: o.email,
		customerName: o.customerName,
		amountCents: o.amountCents,
		items: o.items.map((i) => ({ qty: i.qty, label: i.label, engraving: i.config.engraving })),
		shipping: o.shipping,
		trackingNumber: o.trackingNumber,
		trackingUrl: o.trackingUrl,
		note: o.note,
		accessToken: o.accessToken,
		createdAt: o.createdAt.toISOString()
	}));

	return {
		enabled,
		authed: true,
		orders,
		statuses: STATUSES.map((s) => ({ id: s, label: STATUS_LABEL[s] }))
	};
};

export const actions: Actions = {
	login: async ({ request, cookies }) => {
		const form = await request.formData();
		const password = String(form.get('password') ?? '');
		if (!checkPassword(password)) return fail(401, { message: 'Falsches Passwort' });
		login(cookies);
		return { ok: true };
	},

	logout: async ({ cookies }) => {
		logout(cookies);
		return { ok: true };
	},

	update: async ({ request, cookies, url }) => {
		if (!isAdmin(cookies)) return fail(401, { message: 'Nicht angemeldet' });
		const form = await request.formData();
		const id = String(form.get('id') ?? '');
		const status = String(form.get('status') ?? '') as OrderStatus;
		if (!id || !STATUSES.includes(status)) return fail(400, { message: 'Ungültige Eingabe' });

		const before = (await listOrders()).find((o) => o.id === id);
		const order = await updateOrder(id, {
			status,
			trackingNumber: String(form.get('trackingNumber') ?? '').trim() || undefined,
			trackingUrl: String(form.get('trackingUrl') ?? '').trim() || undefined,
			note: String(form.get('note') ?? '').trim() || undefined
		});
		if (!order) return fail(404, { message: 'Bestellung nicht gefunden' });

		// Kunde nur bei echtem Statuswechsel informieren, nicht bei Notiz-Änderungen
		if (before && before.status !== order.status) {
			await sendStatusUpdate(order, url.origin).catch((e) => console.error('[mail]', e));
		}
		return { ok: true, updated: id };
	}
};
