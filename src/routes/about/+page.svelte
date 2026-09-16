<script lang="ts">
	import SiteHeader from '$lib/components/ui/SiteHeader.svelte';
	import CartDrawer from '$lib/components/ui/CartDrawer.svelte';
	import { Button } from '$lib/components/ui/button';
	import ArrowRight from '@lucide/svelte/icons/arrow-right';

	const stack = [
		['SvelteKit 2 · Svelte 5 Runes', 'Feingranulare Reaktivität, kein VDOM, kleiner Output'],
		['Threlte · Three.js', '3D-Szene deklarativ, prozedurale Geometrie, Bloom via postprocessing'],
		[
			'Tailwind v4 · Shadcn-Svelte',
			'OKLCH-Tokens, Shadcn-Komponenten auf die eigene Palette gemappt'
		],
		['WebAudio', 'Switch-Sounds als Resonator-Synthese, Samples optional'],
		['Stripe Checkout', 'Test-Modus, Konfiguration als Metadata – Stripe ist das Order-System'],
		['Vercel', 'Hobby-Tier, zwei Serverless-Routes, keine Datenbank']
	];

	const decisions = [
		{
			no: '01',
			title: 'Der Server rechnet Preise aus IDs – nie aus Beträgen',
			why: 'Der Client schickt nur Konfigurations-IDs und Mengen. /api/checkout löst sie gegen den Katalog auf, validiert jede einzelne und rechnet den Preis mit derselben pricing.ts, die auch der Browser nutzt. Wer den Request manipuliert, bekommt trotzdem den echten Preis. Alle Beträge sind Integer-Cent – keine Float-Rundung, genau das Format, das Stripe erwartet.',
			code: `// pricing.ts – reine Funktionen, Client und Server
const build = resolveBuild(config);        // IDs → Katalogobjekte
const price = computePrice(build);         // Integer-Cent
if (!isValidConfig(config)) error(400);    // Server: strikt, kein Fallback`
		},
		{
			no: '02',
			title: 'Tastatur-Layouts sind Daten, keine Komponenten',
			why: 'Jede Reihe ist ein String in einer Mini-DSL – Breiten in Units, Lücken, Codes. Daraus entstehen Position und Größe jeder Taste UND das Mapping KeyboardEvent.code → Taste. Deshalb tippt das 3D-Board mit, wenn du auf deiner echten Tastatur schreibst: code ist positionsbezogen, das Label nur Kosmetik. Deutsch/Englisch ändert Legenden, nicht Physik.',
			code: `'Tab:1.5 Q W E R T Y U I O P [ ] \\\\:1.5'
'⇧=ShiftLeft:2.25 Z X C V B N M , . /'
'Ctrl=ControlLeft:1.25 Win:1.25 Alt=AltLeft:1.25 Space:6.25 …'`
		},
		{
			no: '03',
			title: 'Prozedurales 3D ohne ein einziges Modell-Asset',
			why: 'Kein GLTF, kein Blender. Keycaps sind Rounded Boxes, die per Vertex-Loop nach oben verjüngt werden (Cherry-Profil). Das Case ist eine Extrusion mit Fase. Legenden sind SDF-Text, Backlight ist eine emissive Platte, RGB eine 256-Pixel-Textur, deren Offset wandert. Bloom macht daraus Licht. Eine Geometrie pro Keycap-Breite, zwei Materialien pro Set – 87 Tasten kosten keine 87 Shader.',
			code: `// Keycap-Taper: x/z abhängig von der Höhe skalieren
const t = (y + h / 2) / h;        // 0 unten … 1 oben
const k = 1 - 0.16 * t;           // oben 16 % schmaler
pos.setX(i, pos.getX(i) * k);`
		},
		{
			no: '04',
			title: 'Sound aus Physik statt aus Samples',
			why: 'Ein Anschlag ist ein Impuls, der das Gehäuse anregt – und das Gehäuse schwingt in seinen Eigenfrequenzen aus. Genau das wird gebaut: Rauschburst → vier Bandpass-Resonatoren → plus Bottom-out-Thud mit fallender Tonhöhe, einmal in einem OfflineAudioContext gerendert. Die Platte färbt den Klang (Messing höher und länger, Polycarbonat weicher). Legt man echte MP3s ab, werden sie bevorzugt.',
			code: `linear: modes [175 Hz Q9, 340 Q10, 720 Q7, 1600 Q5], thud 95 Hz
brass:  f ×1.18, Q ×1.4, lowpass ×1.35   // steif → "ping"`
		}
	];

	const perf = [
		[
			'Three.js lädt nach dem ersten Paint',
			'Header, Panel, Preis sind sofort da; die Szene blendet sich ein.'
		],
		[
			'DPR auf 1.5 gedeckelt',
			'Retina rendert sonst 4× so viele Pixel für einen Unterschied, den man in dunklen Szenen nicht sieht.'
		],
		[
			'Rendering on demand',
			'Frames nur bei Änderung. Materialwechsel rufen invalidate() – sonst bleibt das Bild stehen.'
		],
		[
			'Tastendruck ≠ Konfiguration',
			'Eigener Store für gedrückte Tasten. Tippen löst keine Preis-Neuberechnung aus.'
		],
		[
			'RGB-Legenden ohne Re-Render',
			'Eine Color pro Taste, pro Frame mutiert. Troika kopiert Color-Objekte beim Rendern – Svelte sieht nichts davon.'
		],
		[
			'Symbolschrift: 5 KB',
			'DejaVu auf 25 Glyphen gesubsettet, weil das Latin-Subset von JetBrains Mono keine ⇧ ← → hat.'
		]
	];
</script>

<svelte:head>
	<title>How it’s built – SwitchForge</title>
	<meta
		name="description"
		content="Case Study: Wie SwitchForge gebaut ist – SvelteKit, Threlte, prozedurales 3D, serverseitiges Pricing, Sound-Synthese, Stripe ohne Datenbank."
	/>
</svelte:head>

<SiteHeader />

<main class="mx-auto max-w-3xl px-6 py-16">
	<p class="font-mono text-[11px] tracking-[0.3em] text-neon uppercase">Case Study</p>
	<h1 class="mt-3 text-3xl font-semibold text-ink sm:text-4xl">Wie SwitchForge gebaut ist</h1>
	<p class="mt-5 text-base leading-relaxed text-ink-muted">
		SwitchForge ist ein Portfolio-Projekt: ein 3D-Konfigurator für mechanische Keyboards mit echtem
		Checkout, gebaut mit der Vorgabe <span class="text-ink">null laufende Kosten</span>. Kein
		Modell-Asset, keine Datenbank, keine Sound-Dateien – alles, was man sieht und hört, entsteht im
		Code. Hier sind die Entscheidungen dahinter.
	</p>

	<!-- Stack -->
	<section class="mt-14">
		<h2 class="font-mono text-[11px] tracking-[0.2em] text-ink-faint uppercase">Stack</h2>
		<dl class="mt-4 divide-y divide-line/70 rounded-panel border border-line bg-surface/50">
			{#each stack as [name, note] (name)}
				<div class="grid gap-1 px-4 py-3 sm:grid-cols-[220px_1fr] sm:gap-4">
					<dt class="font-mono text-xs text-ink">{name}</dt>
					<dd class="text-sm text-ink-muted">{note}</dd>
				</div>
			{/each}
		</dl>
		<p class="mt-4 text-sm leading-relaxed text-ink-muted">
			<span class="text-ink">Warum Svelte?</span> Ein Konfigurator ist ein Reaktivitätsproblem: eine Farbänderung
			soll genau ein Material anfassen, nicht ein Panel mit 40 Buttons neu rendern. Svelte 5 macht das
			ohne memo-Disziplin. Der kompilierte Output ist klein, was zählt, wenn danach 600 KB Three.js kommen.
		</p>
	</section>

	<!-- Entscheidungen -->
	<section class="mt-16">
		<h2 class="font-mono text-[11px] tracking-[0.2em] text-ink-faint uppercase">
			Vier Entscheidungen
		</h2>
		<div class="mt-6 flex flex-col gap-12">
			{#each decisions as d (d.no)}
				<article>
					<h3 class="text-xl font-medium text-ink">
						<span class="mr-3 font-mono text-sm text-neon">{d.no}</span>{d.title}
					</h3>
					<p class="mt-3 text-sm leading-relaxed text-ink-muted">{d.why}</p>
					<pre
						class="mt-4 overflow-x-auto rounded-panel border border-line bg-void/70 p-4 font-mono text-[12px] leading-relaxed text-ink-muted"><code
							>{d.code}</code
						></pre>
				</article>
			{/each}
		</div>
	</section>

	<!-- Performance -->
	<section class="mt-16">
		<h2 class="font-mono text-[11px] tracking-[0.2em] text-ink-faint uppercase">Performance</h2>
		<ul class="mt-4 grid gap-3 sm:grid-cols-2">
			{#each perf as [title, text] (title)}
				<li class="rounded-panel border border-line bg-surface/50 p-4">
					<p class="text-sm font-medium text-ink">{title}</p>
					<p class="mt-1 text-[13px] leading-relaxed text-ink-muted">{text}</p>
				</li>
			{/each}
		</ul>
	</section>

	<!-- Null Kosten -->
	<section class="mt-16">
		<h2 class="font-mono text-[11px] tracking-[0.2em] text-ink-faint uppercase">
			Null laufende Kosten
		</h2>
		<p class="mt-4 text-sm leading-relaxed text-ink-muted">
			Vercel Hobby, Stripe im Test-Modus, keine Datenbank. Supabase war zuerst im Plan und flog
			raus: Der Free-Tier pausiert Projekte nach sieben Tagen Inaktivität – ein Portfolio, das
			jemand drei Wochen nach dem letzten Besuch öffnet, wäre kaputt. Stripe speichert jede
			Checkout-Session inklusive Konfiguration; für ein Demo <em>ist</em> das das Order-System.
		</p>
	</section>

	<!-- Was fehlt -->
	<section class="mt-16">
		<h2 class="font-mono text-[11px] tracking-[0.2em] text-ink-faint uppercase">
			Was ein echter Shop noch bräuchte
		</h2>
		<ol
			class="mt-4 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-ink-muted marker:font-mono marker:text-ink-faint"
		>
			<li>
				Eigene Order-Persistenz per Webhook – <span class="text-ink">idempotent</span>, weil Stripe
				Events doppelt schickt.
			</li>
			<li>Transaktions-Mails (Bestätigung, Versand).</li>
			<li>
				Status-Seite per Link statt Accounts – Gast-Checkout ist, was Custom-Keyboard-Shops
				tatsächlich machen.
			</li>
			<li>Mini-Admin: Status ändern, Tracking eintragen.</li>
			<li>Erst bei echtem Betrieb: Lager, Retouren, AGB, Widerruf, MwSt.</li>
		</ol>
		<p class="mt-4 text-sm text-ink-muted">Das ist Teil zwei.</p>
	</section>

	<div class="mt-16 flex flex-wrap gap-3 border-t border-line pt-10">
		<Button size="lg" class="shadow-glow" href="/build">
			Konfigurator öffnen
			<ArrowRight data-icon="inline-end" />
		</Button>
		<Button size="lg" variant="outline" href="/">Zur Startseite</Button>
	</div>
</main>

<CartDrawer />
