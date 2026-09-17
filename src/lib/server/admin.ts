/**
 * Admin-Zugang: ein Passwort (ADMIN_PASSWORD), ein Cookie.
 *
 * Kein Account-System – für einen Ein-Personen-Shop ist ein Passwort das
 * ehrliche Minimum. Der Cookie enthält einen HMAC des Passworts, nicht das
 * Passwort selbst; wird ADMIN_PASSWORD geändert, sind alle Sessions ungültig.
 */
import { createHmac, timingSafeEqual } from 'node:crypto';
import type { Cookies } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

const COOKIE = 'sf_admin';
const MAX_AGE = 60 * 60 * 24 * 14; // zwei Wochen

function secret(): string | null {
	return env.ADMIN_PASSWORD?.trim() || null;
}

function token(pw: string): string {
	return createHmac('sha256', pw).update('switchforge-admin').digest('base64url');
}

export function adminEnabled(): boolean {
	return !!secret();
}

export function checkPassword(input: string): boolean {
	const pw = secret();
	if (!pw) return false;
	const a = Buffer.from(input);
	const b = Buffer.from(pw);
	return a.length === b.length && timingSafeEqual(a, b);
}

export function isAdmin(cookies: Cookies): boolean {
	const pw = secret();
	const value = cookies.get(COOKIE);
	if (!pw || !value) return false;
	const expected = token(pw);
	const a = Buffer.from(value);
	const b = Buffer.from(expected);
	return a.length === b.length && timingSafeEqual(a, b);
}

export function login(cookies: Cookies) {
	const pw = secret();
	if (!pw) return;
	cookies.set(COOKIE, token(pw), {
		path: '/admin',
		httpOnly: true,
		sameSite: 'lax',
		secure: true,
		maxAge: MAX_AGE
	});
}

export function logout(cookies: Cookies) {
	cookies.delete(COOKIE, { path: '/admin' });
}
