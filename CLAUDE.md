# SwitchForge

Custom Mechanical Keyboard Builder – SvelteKit (Svelte 5 Runes) + Tailwind v4 + Shadcn-Svelte + Threlte + Stripe.
Deploy: Vercel Hobby (adapter-vercel), Stripe Test-Modus, keine Datenbank. Null Kosten ist Vorgabe.

## Befehle

- `npm run dev` – Dev-Server (Vite)
- `npm run check` – svelte-check (muss 0 Errors liefern)
- `npm run format` / `npm run lint` – Prettier

## Architektur-Regeln

- **Preise nur im Katalog** (`src/lib/data/catalog.ts`), immer Integer-Cent. Kein Preis im UI hartcodieren.
- **Pricing-Logik in `src/lib/pricing.ts`** (reine Funktionen: `resolveBuild`, `computePrice`, `isValidConfig`). Client (`builder`) und Server (`/api/checkout`) nutzen dieselbe Funktion – der Server rechnet aus IDs neu.
- **Cart** (`src/lib/stores/cart.svelte.ts`): nur IDs + Menge in localStorage, Preise beim Lesen neu berechnet, Tab-Sync über `storage`-Event. Kein Server-State, keine DB – Stripe ist das Order-System (Konfiguration in `product_data.metadata`).
- **State über `builder`** (`src/lib/stores/builderState.svelte.ts`): Komponenten lesen `$derived`-Felder und schreiben nur über die Setter. Der State ist eine Klasse mit Runes; kein `writable()`.
- **Serialisierung über `builder.snapshot()`/`load()`** – IDs, keine Objekte. Server rechnet Preise aus IDs neu, nie aus Client-Werten.
- **`$lib/server/*` nur serverseitig** importieren (Stripe-Secret).
- **Layouts sind Daten** (`src/lib/data/layouts.ts`, Mini-DSL pro Reihe, `getLayout(size, lang)` gecacht). `keyCount` im Katalog wird daraus abgeleitet, nie hartcodiert. DE/EN ändert nur Labels, Codes bleiben physisch.
- **Legenden-Fonts**: JetBrains Mono (Latin) für Text, `static/fonts/legend-symbols.woff` (DejaVu-Subset, 4 KB) für ⌫ ⏎ ⇧ ← →. Neue Symbole → Subset neu bauen (fonttools, siehe Git-History).
- **Legenden-Kontrast** per Luminanz der Kappenfarbe (`legendFor()` in KeyboardModel) – nie pauschal pro Set. Bei RGB: eine `Color` pro Taste, in `useTask` mutiert (troika kopiert Color-Objekte pro Render).
- **Legenden-Layout**: zentriert; Shift-Belegung oben, Hauptlegende unten (`shiftLabel`), DE-Wörter wie auf ISO-Tastaturen (Strg, Entf, Pos1, Bild↑).
- **Tastendruck ≠ Konfiguration**: `keypress.svelte.ts` (SvelteSet, Sound) ist vom `builder` getrennt, damit Tippen keinen Preis-Recompute auslöst.
- **3D-Geometrie** in `src/lib/components/3d/geometry.ts` (Case-Extrusion mit Fase – Shape um bevelSize geschrumpft, sonst wachsen die Aussenmasse; Seam; Keycap-Taper; Spiralkabel als Tube). `KeyboardModel.svelte` bleibt Szene + Materialien.
- **3D**: geteilte Geometrien pro Keycap-Breite (konisch verjüngt), geteilte Materialien, Farben per `$effect` → `material.color.set()`. Kein GLTF, alles prozedural. Kamera-Distanz aus Layout-Breite + Canvas-Aspect (`SceneCamera.svelte`). Bloom + Neutral-Tonemapping in `PostProcessing.svelte` (`postprocessing`-Lib, HalfFloat-Buffer, Threshold 1.0 → nur Emissive/Legenden > 1 glühen).
- **Sound**: `/static/audio/*.mp3` optional, sonst prozedurale Synthese (`synth.ts`: Impuls → Bandpass-Resonatoren + Thud, gerendert per OfflineAudioContext). Profile-Parameter oben in der Datei.
- **On-demand-Rendering**: Nach direktem `material.*`-Zugriff immer `invalidate()` aus `useThrelte()` rufen, sonst bleibt das Bild stehen.
- Shadcn-Komponenten liegen in `src/lib/components/ui/<name>/`; ihre Tokens (`bg-primary`, `border-input` …) sind in `layout.css` auf die Palette gemappt. Neue: `npx shadcn-svelte@latest add <name> -y`.
- Runes-Modus ist projektweit erzwungen (`vite.config.ts`).
- Design-Tokens leben in `src/routes/layout.css` unter `@theme` (OKLCH). Neue Farben dort anlegen, nicht inline.

## Stripe lokal

`.env` mit `STRIPE_SECRET_KEY=sk_test_…` anlegen. Webhook lokal: `stripe listen --forward-to localhost:5174/api/webhooks/stripe` liefert das `STRIPE_WEBHOOK_SECRET`. Testkarte `4242 4242 4242 4242`.

## Node

Node 20 lokal; `engine-strict` ist aus (`.npmrc`), weil `camera-controls` (Browser-Lib via Threlte) Node ≥22 deklariert. Mit Node 22 kann das zurück.

## Roadmap

1. ✅ Struktur, Config, `builderState` + Pricing
2. ✅ Layouts als Daten, prozedurales 3D pro Layout, Tippen auf echter Tastatur → Modell + Sound, Shadcn, Lazy-Load der Szene
3. ✅ Cart (persistent, Tab-Sync), `/api/checkout` (Stripe Checkout, Server-Pricing), Webhook, `/checkout/success`
4. Deploy auf Vercel + Stripe-Test-Keys + Webhook-Endpoint, echte Sound-Samples, OG-Image, Case Study
5. ✅ Zubehör (Deskmat, Kabel), Gravur, Novelty-Esc – Knob bewusst verworfen (sah nicht gut aus)
