<script lang="ts">
	import { goto } from '$app/navigation';
	import SiteHeader from '$lib/components/ui/SiteHeader.svelte';
	import HeroStory from '$lib/components/landing/HeroStory.svelte';
	import CartDrawer from '$lib/components/ui/CartDrawer.svelte';
	import LayoutSilhouette from '$lib/components/ui/LayoutSilhouette.svelte';
	import { Button } from '$lib/components/ui/button';
	import { builder, formatPrice } from '$lib/stores/builderState.svelte';
	import { resolveBuild, computePrice, type BuildConfig } from '$lib/pricing';
	import { presets } from '$lib/data/presets';
	import { baseKits, switchOptions, defaultSelection, type SwitchType } from '$lib/data/catalog';
	import { soundEngine } from '$lib/audio/soundEngine';
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import Play from '@lucide/svelte/icons/play';

	function start(config: BuildConfig = builder.snapshot()) {
		builder.load(config);
		goto('/build');
	}

	const presetById = Object.fromEntries(presets.map((p) => [p.id, p]));
	const presetCards = presets.map((p) => {
		const build = resolveBuild(p.config);
		return { ...p, build, price: computePrice(build).total, img: `/img/shots/${p.id}.webp` };
	});

	/** Einstiegspreis: Standardkonfiguration mit dem günstigsten Kit */
	const fromPrice = computePrice(
		resolveBuild({ ...defaultSelection, baseKitId: 'forge-60' })
	).total;

	const ticker = [
		'4 Layouts',
		'9 Case-Farben',
		'8 Keycap-Sets',
		'3 Switch-Typen',
		'RGB Wave',
		'Messing-Platte',
		'QWERTZ · QWERTY',
		'Spiralkabel',
		'Gravur',
		'Novelty-Esc',
		'Wireless',
		'Deskmat'
	];

	// Kraftkurven: Weg (x) gegen Kraft (y), 0..100 – schematisch, aber ehrlich zum Typ
	const curves: Record<SwitchType, string> = {
		linear: 'M0,90 L100,30',
		tactile: 'M0,90 C20,80 26,40 34,38 C40,36 42,60 52,58 L100,28',
		clicky: 'M0,90 C22,82 28,42 36,40 L40,62 L100,30'
	};
	const switchNotes: Record<SwitchType, string> = {
		linear: 'Gleichmäßig von oben bis unten. Leise, schnell, zum Zocken und Schreiben.',
		tactile: 'Ein spürbarer Widerstand kurz vor dem Auslösen. Feedback ohne Lärm.',
		clicky: 'Der Bump plus ein hörbarer Klick. Wer Schreibmaschine will, will das.'
	};

	async function play(type: SwitchType) {
		await soundEngine.play(type, 'brass').catch(() => {});
	}

	const steps = [
		['Konfigurieren', 'Layout, Farben, Switches, Licht – alles live in 3D, mit Sound und Preis.'],
		['Bestellen', 'Checkout über Stripe. Deine Konfiguration wandert mit der Bestellung.'],
		[
			'Gebaut & verschickt',
			'Jedes Board wird nach Bestellung gebaut, geschmiert, getestet. Zehn Werktage.'
		]
	];
</script>

<svelte:head>
	<title>SwitchForge – Mechanische Keyboards, gebaut nach dir</title>
	<meta
		name="description"
		content="Konfiguriere dein mechanisches Keyboard in 3D: Layout, Case, Switches, Keycaps, RGB. Hör den Sound, sieh den Preis, bestell es."
	/>
	<meta property="og:title" content="SwitchForge – Mechanische Keyboards, gebaut nach dir" />
	<meta
		property="og:description"
		content="In 3D konfiguriert, vorher gehört, nach Bestellung gebaut. Ab 277 €."
	/>
</svelte:head>

<div class="relative overflow-x-clip">
	<SiteHeader />

	<!-- HERO: das echte Foto zuerst – Vertrauen in einer Sekunde.
	     Höhe = 52vw, damit das Bild (Seitenverhältnis 1.86) immer breiten-gefittet ist:
	     das Board steht dann auf jedem Monitor bei ~38 % der Breite, der Text bleibt links davon. -->
	<section class="relative">
		<div class="relative overflow-hidden lg:h-[min(88vh,52vw)] lg:min-h-[520px]">
			<img
				src="/img/lifestyle/hero.webp"
				alt="Nightshift-Build rechts auf einer Filzmatte, links freier Holzschreibtisch, Sukkulente und Spiralkabel"
				width="1306"
				height="702"
				fetchpriority="high"
				class="h-[62vw] min-h-[260px] w-full object-cover object-[70%_60%] lg:absolute lg:inset-0 lg:h-full lg:object-[50%_60%]"
			/>
			<!-- Verlauf nur auf Desktop, wo der Text über dem Holz liegt -->
			<div
				class="absolute inset-0 hidden bg-[linear-gradient(90deg,oklch(0.1_0.01_260/0.86)_0%,oklch(0.1_0.01_260/0.55)_30%,transparent_48%)] lg:block"
			></div>
			<div
				class="absolute inset-x-0 bottom-0 hidden h-32 bg-[linear-gradient(180deg,transparent,var(--color-void))] lg:block"
			></div>

			<div
				class="relative mx-auto flex max-w-7xl flex-col justify-center px-6 py-10 lg:h-full lg:max-w-none lg:py-0 lg:pl-[6vw]"
			>
				<div class="lg:max-w-[30vw]">
					<span
						class="inline-flex w-fit items-center gap-2 rounded-full border border-ink/15 bg-void/50 px-3 py-1 font-mono text-[10px] tracking-[0.2em] text-ink-muted uppercase backdrop-blur"
					>
						<span class="size-1.5 rounded-full bg-brand"></span>
						Custom Mechanical Keyboards
					</span>
					<h1
						class="mt-5 font-display text-[44px] leading-[0.95] font-extrabold tracking-tight text-ink sm:text-6xl lg:text-[clamp(36px,3.8vw,76px)]"
					>
						Geschmiedet<br />
						<span class="text-brand">für deine</span> Hände.
					</h1>
					<p
						class="mt-5 text-base text-ink-muted sm:text-lg lg:text-[clamp(14px,1.2vw,20px)] lg:whitespace-nowrap"
					>
						In 3D konfiguriert, vorher gehört, von Hand gebaut.
					</p>
					<!-- Preis: gross, weil er die erste Frage beantwortet -->
					<p class="mt-5 flex flex-wrap items-baseline gap-x-2 gap-y-1">
						<span class="font-mono text-[11px] tracking-[0.2em] text-ink-muted uppercase">ab</span>
						<span
							class="text-brand font-display text-3xl font-extrabold sm:text-4xl lg:text-[clamp(28px,2.6vw,44px)]"
						>
							{formatPrice(fromPrice)}
						</span>
						<span class="font-mono text-[10px] text-ink-faint">inkl. MwSt.</span>
					</p>
					<div class="mt-6 flex flex-wrap items-center gap-3">
						<button
							class="inline-flex h-12 items-center gap-2 rounded-full bg-brand px-7 text-sm font-semibold text-void shadow-[0_0_32px_oklch(0.72_0.2_20/0.45)] transition-transform hover:scale-[1.03] focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:outline-none"
							onclick={() => start()}
						>
							Jetzt konfigurieren <ArrowRight class="size-4" />
						</button>
						<a
							href="#deins"
							class="inline-flex h-12 items-center gap-2 rounded-full border border-ink/20 bg-void/40 px-5 text-sm text-ink backdrop-blur transition-colors hover:border-ember"
						>
							Live in 3D ansehen ↓
						</a>
					</div>
					<ul
						class="mt-7 flex flex-wrap gap-x-6 gap-y-2 font-mono text-[10px] tracking-[0.15em] text-ink-muted uppercase"
					>
						<li>Zehn Werktage bis zum Versand</li>
						<li>30 Tage Rückgabe</li>
						<li>Versand aus DE</li>
					</ul>
				</div>
				<!-- Bildunterschrift: welches Board das ist -->
				<button
					class="absolute right-6 bottom-8 hidden items-center gap-2 rounded-full border border-ink/15 bg-void/50 py-1.5 pr-4 pl-1.5 font-mono text-[10px] tracking-[0.15em] text-ink-muted uppercase backdrop-blur transition-colors hover:border-ember hover:text-ink lg:inline-flex"
					onclick={() => start(presetById.nightshift.config)}
				>
					<span class="size-5 rounded-full bg-brand"></span>
					Im Bild: Nightshift · Build öffnen
				</button>
			</div>
		</div>
	</section>

	<!-- TICKER -->
	<div class="overflow-hidden border-y border-line bg-surface/50 py-3">
		<div
			class="flex w-max animate-marquee gap-10 font-mono text-[11px] tracking-[0.25em] whitespace-nowrap text-ink-muted uppercase"
		>
			{#each [...ticker, ...ticker] as item, i (i)}
				<span class="flex items-center gap-10">
					{item}
					<span class="text-brand">◆</span>
				</span>
			{/each}
		</div>
	</div>

	<!-- LIVE: Personalisierung + Scroll-Story mit dem echten 3D-Board -->
	<div id="deins">
		<HeroStory />
	</div>

	<!-- AUS DER WERKSTATT: drei Builds in echter Umgebung -->
	<section class="mx-auto max-w-7xl px-6 py-20">
		<div class="mb-8 flex flex-wrap items-end justify-between gap-6">
			<div>
				<p class="font-mono text-[11px] tracking-[0.2em] text-ink-faint uppercase">
					Aus der Werkstatt
				</p>
				<h2 class="mt-2 font-display text-3xl font-bold text-ink sm:text-4xl">
					Gebaut, fotografiert, verschickt.
				</h2>
			</div>
			<p class="max-w-sm text-sm text-ink-muted">
				Drei Konfigurationen, die genau so den Tisch verlassen haben. Klick öffnet den Build.
			</p>
		</div>
		<div class="grid grid-cols-[minmax(0,1fr)] gap-4 md:grid-cols-3 md:grid-rows-2">
			<!-- Arctic gross, zwei Reihen hoch -->
			<button
				class="group relative overflow-hidden rounded-2xl border border-line text-left md:col-span-2 md:row-span-2"
				onclick={() => start(presetById.bone.config)}
			>
				<img
					src="/img/lifestyle/arctic.webp"
					alt="Arctic-Build mit weißen Keycaps und türkisem Spiralkabel"
					loading="lazy"
					class="h-72 w-full object-cover transition-transform duration-700 group-hover:scale-[1.03] md:h-full"
				/>
				<div
					class="absolute inset-x-0 bottom-0 bg-[linear-gradient(180deg,transparent,oklch(0.1_0.01_260/0.9))] p-5"
				>
					<h3 class="font-display text-xl font-bold text-ink">Arctic · White Backlight</h3>
					<p class="mt-1 text-sm text-ink-muted">Forge 60, Bone-Case, warmweiß von unten.</p>
				</div>
			</button>
			<button
				class="group relative overflow-hidden rounded-2xl border border-line text-left"
				onclick={() => start(presetById.terminal.config)}
			>
				<img
					src="/img/lifestyle/terminal.webp"
					alt="Terminal-Build mit RGB-Legenden"
					loading="lazy"
					class="h-56 w-full object-cover object-left transition-transform duration-700 group-hover:scale-[1.04]"
				/>
				<div
					class="absolute inset-x-0 bottom-0 bg-[linear-gradient(180deg,transparent,oklch(0.1_0.01_260/0.9))] p-4"
				>
					<h3 class="font-display text-lg font-bold text-ink">Terminal · RGB Wave</h3>
				</div>
			</button>
			<button
				class="group relative overflow-hidden rounded-2xl border border-line text-left"
				onclick={() => start(presetById.bone.config)}
			>
				<img
					src="/img/lifestyle/bone.webp"
					alt="Peach-Build mit orangem Spiralkabel"
					loading="lazy"
					class="h-56 w-full object-cover object-left transition-transform duration-700 group-hover:scale-[1.04]"
				/>
				<div
					class="absolute inset-x-0 bottom-0 bg-[linear-gradient(180deg,transparent,oklch(0.1_0.01_260/0.9))] p-4"
				>
					<h3 class="font-display text-lg font-bold text-ink">Peach · Clicky</h3>
				</div>
			</button>
		</div>
	</section>

	<!-- BUILDS -->
	<section id="builds" class="mx-auto max-w-7xl px-6 py-20">
		<div class="mb-8 flex flex-wrap items-end justify-between gap-6">
			<div>
				<p class="font-mono text-[11px] tracking-[0.2em] text-ink-faint uppercase">
					Starter-Builds
				</p>
				<h2 class="mt-2 font-display text-3xl font-bold text-ink sm:text-4xl">Drei Charaktere.</h2>
			</div>
			<p class="max-w-sm text-sm text-ink-muted">
				Jeder Build öffnet im Konfigurator. Nimm ihn, wie er ist – oder als Ausgangspunkt.
			</p>
		</div>

		<div
			class="-mx-6 flex snap-x snap-mandatory [scrollbar-width:none] gap-5 overflow-x-auto px-6 pb-4 md:mx-0 md:grid md:grid-cols-3 md:overflow-visible md:px-0"
		>
			{#each presetCards as preset (preset.id)}
				<button
					class="group relative w-[82vw] shrink-0 snap-start overflow-hidden rounded-2xl border border-line bg-surface/60 text-left transition-colors hover:border-ink-faint focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:outline-none sm:w-[60vw] md:w-auto"
					onclick={() => start(preset.config)}
				>
					<!-- Farbschein aus der Akzentfarbe des Builds -->
					<div
						class="pointer-events-none absolute inset-x-0 top-0 h-56 opacity-60 blur-3xl transition-opacity group-hover:opacity-90"
						style:background={`radial-gradient(60% 60% at 50% 30%, ${preset.build.keycapSet.colors.accent}55, transparent 70%)`}
					></div>
					<img
						src={preset.img}
						alt={`${preset.name} – ${preset.build.baseKit.name} mit ${preset.build.keycapSet.name}-Keycaps`}
						width="1600"
						height="1000"
						loading="lazy"
						class="relative aspect-[8/5] w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
					/>
					<div class="relative p-5">
						<div class="flex items-baseline justify-between gap-3">
							<h3 class="font-display text-xl font-bold text-ink">{preset.name}</h3>
							<span class="font-mono text-sm text-ink">{formatPrice(preset.price)}</span>
						</div>
						<p class="mt-1 text-sm text-ink-muted">{preset.tagline}</p>
						<p class="mt-3 font-mono text-[10px] tracking-wide text-ink-faint">
							{preset.build.baseKit.name} · {preset.build.switch.name} · {preset.build.plate.name}
						</p>
						<span class="mt-4 inline-flex items-center gap-1 text-brand text-sm font-medium">
							Build öffnen <ArrowRight class="size-4 text-ember" />
						</span>
					</div>
				</button>
			{/each}
		</div>
	</section>

	<!-- BENTO -->
	<section class="mx-auto max-w-7xl px-6 pb-20">
		<div class="grid grid-cols-[minmax(0,1fr)] gap-4 md:grid-cols-6 md:grid-rows-[280px_280px]">
			<!-- Licht: großes Bild -->
			<div
				class="relative min-h-[260px] overflow-hidden rounded-2xl border border-line md:col-span-4"
			>
				<img
					src="/img/shots/detail-side.webp"
					alt="RGB-Welle leuchtet durch die Legenden"
					loading="lazy"
					class="absolute inset-0 h-full w-full object-cover"
				/>
				<div
					class="absolute inset-0 bg-[linear-gradient(90deg,oklch(0.13_0.01_260/0.9)_0%,transparent_60%)]"
				></div>
				<div class="relative flex h-full flex-col justify-end p-6">
					<span
						class="mb-3 h-1 w-40 animate-hue rounded-full bg-[linear-gradient(90deg,#f43f5e,#f59e0b,#a3e635,#22d3ee,#a855f7,#f43f5e)]"
					></span>
					<h3 class="font-display text-2xl font-bold text-ink">
						Licht, das durch die Tasten kommt.
					</h3>
					<p class="mt-1 max-w-sm text-sm text-ink-muted">
						RGB-Welle oder warmes Weiß – die Legenden leuchten mit, nicht nur die Spalten
						dazwischen.
					</p>
				</div>
			</div>

			<!-- Sound -->
			<div
				class="flex min-w-0 flex-col justify-between rounded-2xl border border-line bg-surface/60 p-6 md:col-span-2"
			>
				<div class="flex h-16 items-end gap-1">
					{#each { length: 18 } as _, i (i)}
						<span
							class="w-full animate-eq rounded-sm bg-brand"
							style:height={`${30 + ((i * 37) % 70)}%`}
							style:animation-delay={`${(i * 97) % 1100}ms`}
						></span>
					{/each}
				</div>
				<div>
					<h3 class="font-display text-xl font-bold text-ink">Hör es, bevor du kaufst.</h3>
					<p class="mt-1 text-sm text-ink-muted">
						Jeder Anschlag klingt nach deinen Switches und deiner Platte.
					</p>
				</div>
			</div>

			<!-- Layouts aus echten Daten -->
			<div class="min-w-0 rounded-2xl border border-line bg-surface/60 p-6 md:col-span-2">
				<h3 class="font-display text-xl font-bold text-ink">Vier Layouts.</h3>
				<p class="mt-1 text-sm text-ink-muted">Von 61 bis 87 Tasten. Deutsch oder Englisch.</p>
				<div class="mt-4 grid grid-cols-2 gap-3">
					{#each baseKits as kit (kit.id)}
						<div class="min-w-0 text-neon">
							<LayoutSilhouette size={kit.layout} class="h-auto w-full" />
							<p class="mt-1 font-mono text-[10px] text-ink-faint">{kit.layout} · {kit.keyCount}</p>
						</div>
					{/each}
				</div>
			</div>

			<!-- Preis -->
			<div
				class="flex min-w-0 flex-col justify-between rounded-2xl border border-line bg-brand p-6 text-void md:col-span-2"
			>
				<p class="font-mono text-[10px] tracking-[0.2em] uppercase opacity-80">Ab</p>
				<p
					class="font-display text-[clamp(26px,8.5vw,48px)] font-extrabold tracking-tight whitespace-nowrap"
				>
					{formatPrice(fromPrice)}
				</p>
				<p class="text-sm opacity-90">
					Jede Option rechnet sich live in den Preis. An der Kasse steht dieselbe Zahl.
				</p>
			</div>

			<!-- Rückseite -->
			<div
				class="relative min-h-[240px] overflow-hidden rounded-2xl border border-line md:col-span-2"
			>
				<img
					src="/img/shots/detail-rear.webp"
					alt="Spiralkabel und Badge auf der Rückseite"
					loading="lazy"
					class="absolute inset-0 h-full w-full object-cover"
				/>
				<div
					class="absolute inset-0 bg-[linear-gradient(0deg,oklch(0.13_0.01_260/0.92)_0%,transparent_60%)]"
				></div>
				<div class="relative flex h-full flex-col justify-end p-6">
					<h3 class="font-display text-xl font-bold text-ink">Kabel in Akzentfarbe.</h3>
					<p class="mt-1 text-sm text-ink-muted">Oder Wireless mit 2,4 GHz und Bluetooth.</p>
				</div>
			</div>
		</div>
	</section>

	<!-- SWITCHES -->
	<section class="border-t border-line bg-surface/30">
		<div class="mx-auto max-w-7xl px-6 py-20">
			<p class="font-mono text-[11px] tracking-[0.2em] text-ink-faint uppercase">Switches</p>
			<h2 class="mt-2 font-display text-3xl font-bold text-ink sm:text-4xl">
				Drei Arten zu tippen.
			</h2>
			<div class="mt-8 grid grid-cols-[minmax(0,1fr)] gap-4 md:grid-cols-3">
				{#each switchOptions as sw (sw.id)}
					<div class="rounded-2xl border border-line bg-void/50 p-6">
						<svg viewBox="0 0 100 100" class="h-28 w-full" aria-hidden="true">
							<defs>
								<linearGradient id={`brand-${sw.id}`} x1="0" x2="1">
									<stop offset="0" stop-color="oklch(0.62 0.24 300)" />
									<stop offset="1" stop-color="oklch(0.72 0.19 45)" />
								</linearGradient>
							</defs>
							<path d="M0,90 L100,90" stroke="currentColor" class="text-line" stroke-width="1" />
							<path
								d={curves[sw.type]}
								fill="none"
								stroke={`url(#brand-${sw.id})`}
								stroke-width="3"
								stroke-linecap="round"
							/>
						</svg>
						<div class="mt-4 flex items-start justify-between gap-3">
							<div>
								<h3 class="font-display text-xl font-bold text-ink">{sw.name}</h3>
								<p class="font-mono text-[10px] tracking-[0.15em] text-ink-faint uppercase">
									{sw.type} · {sw.actuationForceG}g
								</p>
							</div>
							<button
								class="flex size-10 shrink-0 items-center justify-center rounded-full border border-line text-ink transition-colors hover:border-ember hover:text-ember"
								aria-label={`${sw.name} anhören`}
								onclick={() => play(sw.type)}
							>
								<Play class="size-4" />
							</button>
						</div>
						<p class="mt-3 text-sm leading-relaxed text-ink-muted">{switchNotes[sw.type]}</p>
					</div>
				{/each}
			</div>
		</div>
	</section>

	<!-- PROZESS -->
	<section class="mx-auto max-w-7xl px-6 py-20">
		<div class="grid gap-10 md:grid-cols-3">
			{#each steps as [title, text], i (title)}
				<div>
					<span class="text-brand font-display text-5xl font-extrabold">0{i + 1}</span>
					<h3 class="mt-3 font-display text-xl font-bold text-ink">{title}</h3>
					<p class="mt-2 text-sm leading-relaxed text-ink-muted">{text}</p>
				</div>
			{/each}
		</div>
	</section>

	<!-- CASE STUDY -->
	<section class="mx-auto max-w-7xl px-6 pb-20">
		<a
			href="/about"
			class="group grid overflow-hidden rounded-2xl border border-line bg-surface/60 transition-colors hover:border-ink-faint md:grid-cols-2"
		>
			<div class="p-8">
				<p class="font-mono text-[11px] tracking-[0.2em] text-ink-faint uppercase">
					Für Entwickler
				</p>
				<h2 class="mt-2 font-display text-2xl font-bold text-ink">Wie das hier gebaut ist</h2>
				<p class="mt-3 text-sm leading-relaxed text-ink-muted">
					Kein Modell-Asset, keine Datenbank, keine Sound-Dateien. Prozedurales 3D, Preise vom
					Server aus IDs, Layouts als Daten. Die Entscheidungen und warum.
				</p>
				<span class="mt-5 inline-flex items-center gap-1 text-brand text-sm font-medium">
					Case Study lesen <ArrowRight class="size-4 text-ember" />
				</span>
			</div>
			<pre
				class="min-w-0 overflow-x-auto border-t border-line bg-void/70 p-6 font-mono text-[11px] leading-relaxed whitespace-pre-wrap text-ink-muted md:border-t-0 md:border-l"><code
					>{`'Tab:1.5 Q W E R T Y U I O P [ ] \\\\:1.5'
'⇧=ShiftLeft:2.25 Z X C V B N M , . /'

const build = resolveBuild(config)   // IDs → Katalog
const price = computePrice(build)    // Integer-Cent`}</code
				></pre>
		</a>
	</section>

	<!-- CTA -->
	<section class="mx-auto max-w-7xl px-6 pb-24">
		<div
			class="relative overflow-hidden rounded-3xl border border-line bg-void px-8 py-16 text-center"
		>
			<img
				src="/img/lifestyle/nightshift.webp"
				alt=""
				loading="lazy"
				class="absolute inset-0 h-full w-full object-cover object-center opacity-35"
			/>
			<div
				class="absolute inset-0 bg-[radial-gradient(70%_80%_at_50%_50%,oklch(0.1_0.01_260/0.55),oklch(0.1_0.01_260/0.92))]"
			></div>
			<h2 class="relative font-display text-4xl font-extrabold text-ink sm:text-6xl">Bau deins.</h2>
			<p class="relative mx-auto mt-4 max-w-md text-ink-muted">
				Zehn Minuten im Konfigurator. Ein Keyboard, das es genau einmal gibt.
			</p>
			<button
				class="relative mt-8 inline-flex h-12 items-center gap-2 rounded-full bg-brand px-8 text-sm font-semibold text-void shadow-[0_0_40px_oklch(0.72_0.2_20/0.45)] transition-transform hover:scale-[1.03]"
				onclick={() => start()}
			>
				Konfigurator öffnen <ArrowRight class="size-4" />
			</button>
		</div>
	</section>

	<footer class="border-t border-line">
		<div
			class="mx-auto flex max-w-7xl flex-col gap-3 px-6 py-8 font-mono text-[10px] tracking-[0.15em] text-ink-faint uppercase sm:flex-row sm:items-center sm:justify-between"
		>
			<span>Switch<span class="text-brand">Forge</span> · Portfolio-Projekt</span>
			<span>Demo-Shop · Stripe Test-Modus · Es wird nichts berechnet</span>
		</div>
	</footer>
</div>

<CartDrawer />
