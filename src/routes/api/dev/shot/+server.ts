/**
 * POST /api/dev/shot?name=hero  (Body: image/webp)
 * Schreibt ein Render aus /dev/shots nach static/img/shots/<name>.webp.
 * Nur im Dev-Server – in Production existiert die Route faktisch nicht.
 */
import { dev } from '$app/environment';
import { json, error } from '@sveltejs/kit';
import { writeFile, mkdir } from 'node:fs/promises';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, url }) => {
	if (!dev) error(404, 'Not found');
	const name = url.searchParams.get('name') ?? '';
	if (!/^[a-z0-9-]{1,40}$/.test(name)) error(400, 'Ungültiger Name');

	const bytes = new Uint8Array(await request.arrayBuffer());
	if (bytes.length === 0) error(400, 'Leer');

	await mkdir('static/img/shots', { recursive: true });
	await writeFile(`static/img/shots/${name}.webp`, bytes);
	return json({ ok: true, bytes: bytes.length });
};
