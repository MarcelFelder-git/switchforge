# SwitchForge

Custom Mechanical Keyboard Builder – SvelteKit (Svelte 5 Runes) + Tailwind v4 + Shadcn-Svelte + Threlte + Stripe.
Deploy: Vercel Hobby (adapter-vercel), Stripe Test-Modus, keine Datenbank. Null Kosten ist Vorgabe.

## Befehle

- `npm run dev` – Dev-Server (Vite)
- `npm run check` – svelte-check (muss 0 Errors liefern)
- `npm run format` / `npm run lint` – Prettier

## Architektur-Regeln

- **Preise nur im Katalog** (`src/lib/data/catalog.ts`), immer Integer-Cent. Kein Preis im UI hartcodieren.
- **State über `builder`** (`src/lib/stores/builderState.svelte.ts`): Komponenten lesen `$derived`-Felder und schreiben nur über die Setter. Der State ist eine Klasse mit Runes; kein `writable()`.
- **Serialisierung über `builder.snapshot()`/`load()`** – IDs, keine Objekte. Server rechnet Preise aus IDs neu, nie aus Client-Werten.
- **`$lib/server/*` nur serverseitig** importieren (Stripe-Secret).
- **Layouts sind Daten** (`src/lib/data/layouts.ts`, Mini-DSL pro Reihe). `keyCount` im Katalog wird daraus abgeleitet, nie hartcodiert.
- **Tastendruck ≠ Konfiguration**: `keypress.svelte.ts` (SvelteSet, Sound) ist vom `builder` getrennt, damit Tippen keinen Preis-Recompute auslöst.
- **3D**: geteilte Geometrien pro Keycap-Breite, geteilte Materialien, Farben per `$effect` → `material.color.set()`. Kein GLTF, alles prozedural. Kamera-Distanz aus Layout-Breite + Canvas-Aspect (`SceneCamera.svelte`).
- **Sound**: `/static/audio/*.mp3` optional, sonst prozedurale Synthese (`synth.ts`: Impuls → Bandpass-Resonatoren + Thud, gerendert per OfflineAudioContext). Profile-Parameter oben in der Datei.
- **On-demand-Rendering**: Nach direktem `material.*`-Zugriff immer `invalidate()` aus `useThrelte()` rufen, sonst bleibt das Bild stehen.
- Shadcn-Komponenten liegen in `src/lib/components/ui/<name>/`; ihre Tokens (`bg-primary`, `border-input` …) sind in `layout.css` auf die Palette gemappt. Neue: `npx shadcn-svelte@latest add <name> -y`.
- Runes-Modus ist projektweit erzwungen (`vite.config.ts`).
- Design-Tokens leben in `src/routes/layout.css` unter `@theme` (OKLCH). Neue Farben dort anlegen, nicht inline.

## Node

Node 20 lokal; `engine-strict` ist aus (`.npmrc`), weil `camera-controls` (Browser-Lib via Threlte) Node ≥22 deklariert. Mit Node 22 kann das zurück.

## Roadmap

1. ✅ Struktur, Config, `builderState` + Pricing
2. ✅ Layouts als Daten, prozedurales 3D pro Layout, Tippen auf echter Tastatur → Modell + Sound, Shadcn, Lazy-Load der Szene
3. Cart-State (persistent, mehrere Line-Items), `/api/checkout`, Webhook, Bestätigungsseite
4. Zubehör in derselben Szene (Deskmat, Cable), Case Study, OG-Image, Deploy
