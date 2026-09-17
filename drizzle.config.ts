import { defineConfig } from 'drizzle-kit';

// Schema → SQL-Migrationen in ./drizzle; `npm run db:push` spielt sie auf DATABASE_URL ein
export default defineConfig({
	schema: './src/lib/server/db/schema.ts',
	out: './drizzle',
	dialect: 'postgresql',
	dbCredentials: { url: process.env.DATABASE_URL ?? '' }
});
