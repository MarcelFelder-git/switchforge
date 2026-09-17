# SwitchForge

Custom Mechanical Keyboard Builder – ein 3D-Konfigurator mit Live-Preis, Sound-Vorschau und Stripe-Checkout. Portfolio-Projekt, gebaut mit der Vorgabe **null laufende Kosten**: kein Modell-Asset, keine Datenbank, keine Sound-Dateien. Alles, was man sieht und hört, entsteht im Code.

![Nightshift-Build auf dem Schreibtisch](static/og.jpg)

## Was es kann

- **3D-Konfigurator** (Threlte/Three.js): 4 Layouts, 9 Case-Farben, 8 Keycap-Sets, 3 Switch-Typen, Platte, Beleuchtung, Wireless, Novelty-Esc, Gravur, Deskmat. Prozedurale Geometrie – Keycaps mit Cherry-Profil, Case mit Fase, Spiralkabel als Tube.
- **Tipp auf deiner Tastatur** – das 3D-Board drückt die Tasten mit und spielt den Sound der gewählten Switches. Layouts sind Daten; `KeyboardEvent.code` ist positionsbezogen, deshalb stimmt es in Deutsch und Englisch.
- **Sound aus Physik**: Impuls → Bandpass-Resonatoren → Bottom-out-Thud, gerendert im `OfflineAudioContext`. Die Platte färbt den Klang. Echte Samples in `static/audio/` werden bevorzugt.
- **Pricing serverseitig aus IDs**: Der Client schickt Konfigurations-IDs, `/api/checkout` rechnet mit derselben `pricing.ts` wie der Browser. Integer-Cent, kein Float.
- **Stripe Checkout** im Test-Modus, Konfiguration als Metadata – Stripe ist das Order-System. Webhook mit Signaturprüfung, Bestätigungsseite.
- **Landing** mit Scroll-Story (ein sticky Board, Kamera fährt durch die Details), Personalisierung im Hero, Produktrenders aus der eigenen Szene.

## Stack

SvelteKit 2 · Svelte 5 Runes · Tailwind v4 · Shadcn-Svelte · Threlte 8 · postprocessing (Bloom) · WebAudio · Stripe · Vercel

## Lokal

```bash
npm install
cp .env.example .env   # STRIPE_SECRET_KEY=sk_test_… eintragen
npm run dev
```

Testkarte: `4242 4242 4242 4242`. Webhook lokal: `stripe listen --forward-to localhost:5173/api/webhooks/stripe`.

Produktrenders: `/dev/shots` (nur im Dev-Server) rendert Konfigurationen mit festen Kamerawinkeln nach `static/img/shots/`.

## Die Entscheidungen dahinter

Stehen auf `/about` – Server-Pricing aus IDs, Layouts als Daten, prozedurales 3D ohne Asset, Sound aus Resonatoren, und warum Supabase rausgeflogen ist.

## Teil zwei: echte Bestellungen (optional)

Neon Postgres + Drizzle, idempotenter Webhook (Event-IDs in `stripe_events`), Bestätigungs- und Status-Mails über Resend, Status-Seite per Token (`/orders/SF-…?t=…`), Mini-Admin unter `/admin`. Ohne `DATABASE_URL` läuft die Demo wie vorher – die DB ist ein Upgrade, kein Blocker.

```bash
# .env: DATABASE_URL, ADMIN_PASSWORD, optional RESEND_API_KEY
npm run db:push
```

Live: [switchforge.vercel.app](https://switchforge.vercel.app)

---

Demo-Shop. Es wird nichts berechnet und nichts verschickt.
