/**
 * Transaktions-Mails über Resend (Free-Tier: 3.000/Monat).
 *
 * Optional: ohne RESEND_API_KEY wird nur geloggt. Hinweis für den Test-Modus:
 * Ohne verifizierte Domain darf Resend nur an die eigene Account-Adresse
 * senden – MAIL_FROM dann auf "SwitchForge <onboarding@resend.dev>" lassen.
 */
import { Resend } from 'resend';
import { env } from '$env/dynamic/private';
import type { Order } from './db/schema';
import { STATUS_LABEL } from './orders';
import { formatPrice } from '$lib/pricing';

function client(): Resend | null {
	const key = env.RESEND_API_KEY?.trim();
	return key ? new Resend(key) : null;
}

function from(): string {
	return env.MAIL_FROM?.trim() || 'SwitchForge <onboarding@resend.dev>';
}

function statusUrl(order: Order, origin: string) {
	return `${origin}/orders/${order.id}?t=${order.accessToken}`;
}

function layout(title: string, body: string): string {
	return `<!doctype html><html lang="de"><body style="margin:0;background:#0b0b0f;color:#e8e8ec;font-family:Inter,system-ui,sans-serif">
<div style="max-width:560px;margin:0 auto;padding:40px 24px">
  <p style="font:800 20px Syne,Inter,sans-serif;margin:0 0 24px">Switch<span style="color:#f97316">Forge</span></p>
  <h1 style="font-size:22px;margin:0 0 16px">${title}</h1>
  ${body}
  <p style="color:#6b6b75;font-size:11px;margin-top:40px">Demo-Shop – Stripe Test-Modus. Es wurde nichts berechnet und nichts verschickt.</p>
</div></body></html>`;
}

function itemsHtml(order: Order): string {
	const rows = order.items
		.map(
			(i) =>
				`<tr><td style="padding:8px 0;border-bottom:1px solid #26262c">${i.qty}× ${i.label}</td><td style="padding:8px 0;border-bottom:1px solid #26262c;text-align:right;font-family:ui-monospace,monospace">${formatPrice(i.unitCents * i.qty)}</td></tr>`
		)
		.join('');
	return `<table style="width:100%;border-collapse:collapse;font-size:14px">${rows}
<tr><td style="padding:12px 0;font-weight:600">Gesamt</td><td style="padding:12px 0;text-align:right;font-family:ui-monospace,monospace;font-weight:600">${formatPrice(order.amountCents)}</td></tr></table>`;
}

function button(href: string, label: string) {
	return `<p style="margin:24px 0"><a href="${href}" style="display:inline-block;background:linear-gradient(100deg,#8b5cf6,#f97316);color:#0b0b0f;text-decoration:none;font-weight:600;padding:12px 22px;border-radius:999px">${label}</a></p>`;
}

async function send(to: string, subject: string, html: string) {
	const resend = client();
	if (!resend) {
		console.log(`[mail] (kein RESEND_API_KEY) an ${to}: ${subject}`);
		return;
	}
	const { error } = await resend.emails.send({ from: from(), to, subject, html });
	if (error) console.error('[mail] Resend-Fehler:', error);
}

export async function sendOrderConfirmation(order: Order, origin: string) {
	if (!order.email) return;
	const url = statusUrl(order, origin);
	await send(
		order.email,
		`Bestellung ${order.id} – wir bauen dein Board`,
		layout(
			`Danke${order.customerName ? `, ${order.customerName.split(' ')[0]}` : ''}.`,
			`<p style="color:#a1a1aa;line-height:1.6">Deine Bestellung <strong style="color:#e8e8ec">${order.id}</strong> ist eingegangen. Wir bauen jedes Board nach Bestellung – rechne mit zehn Werktagen bis zum Versand. Den Status siehst du jederzeit hier:</p>
${button(url, 'Bestellstatus ansehen')}
${itemsHtml(order)}`
		)
	);
}

export async function sendStatusUpdate(order: Order, origin: string) {
	if (!order.email) return;
	const url = statusUrl(order, origin);
	const label = STATUS_LABEL[order.status];
	const tracking =
		order.status === 'shipped' && order.trackingNumber
			? `<p style="color:#a1a1aa;line-height:1.6">Sendungsnummer: <strong style="color:#e8e8ec">${order.trackingNumber}</strong>${order.trackingUrl ? ` · <a href="${order.trackingUrl}" style="color:#f97316">Sendung verfolgen</a>` : ''}</p>`
			: '';
	await send(
		order.email,
		`Bestellung ${order.id}: ${label}`,
		layout(
			`${label}.`,
			`<p style="color:#a1a1aa;line-height:1.6">Deine Bestellung <strong style="color:#e8e8ec">${order.id}</strong> hat einen neuen Status: <strong style="color:#e8e8ec">${label}</strong>.</p>
${tracking}
${button(url, 'Bestellstatus ansehen')}`
		)
	);
}
