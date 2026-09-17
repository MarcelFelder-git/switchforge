/**
 * Datenbank-Zugriff, lazy und optional.
 *
 * Neon über HTTP (kein Connection-Pool nötig – passt zu Serverless-Functions,
 * die pro Request starten). Ohne DATABASE_URL gibt es keine DB: Webhook loggt
 * dann nur, Status-Seite und Admin melden "nicht konfiguriert". Die Demo
 * funktioniert so weiter, die Datenbank ist ein Upgrade.
 */
import { drizzle, type NeonHttpDatabase } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { env } from '$env/dynamic/private';
import * as schema from './schema';

export type Db = NeonHttpDatabase<typeof schema>;

let db: Db | null = null;

export function hasDb(): boolean {
	return !!env.DATABASE_URL?.trim();
}

export function getDb(): Db {
	if (db) return db;
	const url = env.DATABASE_URL?.trim();
	if (!url) throw new Error('DATABASE_URL ist nicht gesetzt');
	db = drizzle(neon(url), { schema });
	return db;
}

export { schema };
