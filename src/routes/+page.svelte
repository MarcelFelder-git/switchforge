<script lang="ts">
	import { goto } from '$app/navigation';
	import { MediaQuery } from 'svelte/reactivity';
	import SiteHeader from '$lib/components/ui/SiteHeader.svelte';
	import CartDrawer from '$lib/components/ui/CartDrawer.svelte';
	import { Button } from '$lib/components/ui/button';
	import { builder, BuilderState, formatPrice } from '$lib/stores/builderState.svelte';
	import { resolveBuild, computePrice } from '$lib/pricing';
	import { presets, showcaseConfig } from '$lib/data/presets';
	import { baseKits, caseColors, keycapSets, switchOptions } from '$lib/data/catalog';
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import Keyboard from '@lucide/svelte/icons/keyboard';
	import Volume2 from '@lucide/svelte/icons/volume-2';
	import Receipt from '@lucide/svelte/icons/receipt';

	// Eigener State fürs Hero-Board – der Konfigurator bleibt unberührt
	const showcase = new BuilderState();
	showcase.load(showcaseConfig);

	const scenePromise = import('$lib/components/3d/Scene.svelte');
	// Desktop: Board rechts neben dem Text. Mobile: Board unter dem Text.
	const mobile = new MediaQuery('(max-width: 639px)');

	function start(config = builder.snapshot()) {
		builder.load(config);
		goto('/build');
	}

	const presetCards = presets.map((p) => {
		const build = resolveBuild(p.config);
		return { ...p, build, price: computePrice(build).total };
	});

	const facts = [
		{ n: baseKits.length, label: 'Layouts' },
		{ n: caseColors.length, label: 'Case-Farben' },
		{ n: keycapSets.length, label: 'Keycap-Sets' },
		{ n: switchOptions.length, label: 'Switch-Typen' }
	];

	const props = [
		{
			icon: Keyboard,
			title: 'Sieh es, bevor du es kaufst',
			text: 'Jede Änderung sofort in 3D – Case, Keycaps, Licht. Dreh es, tipp drauf.'
		},
		{
			icon: Volume2,
			title: 'Hör den Unterschied',
			text: 'Linear, taktil oder clicky: Tipp auf deiner Tastatur, das Board antwortet mit dem Klang deiner Switches.'
		},
		{
			icon: Receipt,
			title: 'Preis ohne Überraschung',
			text: 'Jede Option rechnet sich live in den Gesamtpreis. Keine versteckten Aufschläge an der Kasse.'
		}
	];
</script>

<svelte:head>
	<title>SwitchForge – Dein Keyboard, bis zur letzten Taste</title>
	<meta
		name="description"
		content="Konfiguriere dein mechanisches Keyboard in 3D: Layout, Case, Switches, Keycaps, Beleuchtung. Hör den Sound, sieh den Preis, bestell es."
	/>
</svelte:head>

<SiteHeader />

<!-- Hero: 3D-Board als Hintergrund, Text links darüber -->
<section
	class="relative h-[min(88vh,860px)] min-h-[640px] overflow-hidden bg-void sm:min-h-[520px]"
>
	<div class="absolute inset-0">
		{#await scenePromise}
			<div class="flex h-full w-full items-center justify-center scanlines">
				<span class="animate-pulse font-mono text-[10px] tracking-[0.3em] text-ink-faint uppercase">
					Loading Scene
				</span>
			</div>
		{:then { default: Scene }}
			<Scene
				build={showcase}
				autoRotate
				shiftX={mobile.current ? 0 : 0.22}
				shiftY={mobile.current ? 0.3 : 0}
			/>
		{/await}
	</div>

	<!-- Verlauf, damit der Text auf dem Board lesbar bleibt -->
	<div
		class="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,oklch(0.13_0.01_260/0.95)_0%,oklch(0.13_0.01_260/0.7)_45%,transparent_70%)] sm:bg-[linear-gradient(90deg,oklch(0.13_0.01_260/0.92)_0%,oklch(0.13_0.01_260/0.55)_38%,transparent_65%)]"
	></div>

	<div
		class="pointer-events-none relative flex h-full max-w-2xl flex-col justify-start px-6 pt-10 pb-16 sm:justify-center sm:px-12 sm:py-16"
	>
		<p class="mb-4 font-mono text-[11px] tracking-[0.3em] text-neon uppercase">
			Custom Mechanical Keyboards
		</p>
		<h1 class="text-4xl leading-[1.05] font-semibold text-ink sm:text-6xl">
			Dein Keyboard.<br />
			<span class="text-ink-muted">Bis zur letzten Taste.</span>
		</h1>
		<p class="mt-6 max-w-md text-base text-ink-muted sm:text-lg">
			Layout, Case, Switches, Keycaps, Licht – konfiguriert in 3D, gehört bevor du kaufst, gebaut
			nach deiner Bestellung.
		</p>
		<div class="pointer-events-auto mt-8 flex flex-wrap gap-3">
			<Button size="lg" class="shadow-glow" onclick={() => start()}>
				Jetzt konfigurieren
				<ArrowRight data-icon="inline-end" />
			</Button>
			<Button size="lg" variant="outline" href="/about">How it’s built</Button>
		</div>
		<p class="mt-6 font-mono text-[10px] tracking-[0.15em] text-ink-faint uppercase">
			Tipp auf deiner Tastatur – das Board tippt mit
		</p>
	</div>
</section>

<!-- Zahlen -->
<section class="border-y border-line bg-surface/60">
	<div class="mx-auto grid max-w-6xl grid-cols-2 divide-line/70 px-6 sm:grid-cols-4 sm:divide-x">
		{#each facts as fact (fact.label)}
			<div class="py-6 sm:px-6 sm:first:pl-0">
				<p class="font-mono text-3xl text-acid">{fact.n}</p>
				<p class="font-mono text-[10px] tracking-[0.2em] text-ink-faint uppercase">{fact.label}</p>
			</div>
		{/each}
	</div>
</section>

<!-- Value Props -->
<section class="mx-auto max-w-6xl px-6 py-20">
	<div class="grid gap-10 md:grid-cols-3">
		{#each props as prop (prop.title)}
			<div>
				<span
					class="mb-5 flex size-10 items-center justify-center rounded-panel border border-line bg-surface text-neon"
				>
					<prop.icon class="size-5" />
				</span>
				<h2 class="text-lg font-medium text-ink">{prop.title}</h2>
				<p class="mt-2 text-sm leading-relaxed text-ink-muted">{prop.text}</p>
			</div>
		{/each}
	</div>
</section>

<!-- Starter-Builds -->
<section class="border-t border-line bg-surface/40">
	<div class="mx-auto max-w-6xl px-6 py-20">
		<div class="mb-8 flex items-end justify-between gap-6">
			<div>
				<p class="font-mono text-[11px] tracking-[0.2em] text-ink-faint uppercase">
					Starter-Builds
				</p>
				<h2 class="mt-2 text-2xl font-medium text-ink">Nimm eins als Ausgangspunkt</h2>
			</div>
			<p class="hidden max-w-xs text-sm text-ink-muted sm:block">
				Jeder Build öffnet im Konfigurator – ändere, was du willst.
			</p>
		</div>

		<div class="grid gap-4 md:grid-cols-3">
			{#each presetCards as preset (preset.id)}
				<button
					class="group rounded-panel border border-line bg-void/60 p-5 text-left transition-colors hover:border-neon focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:outline-none"
					onclick={() => start(preset.config)}
				>
					<!-- Farbvorschau: Case als Rahmen, Keycaps als Streifen -->
					<div
						class="mb-5 flex h-24 items-end rounded-panel border border-line p-3"
						style:background={preset.build.caseColor.hex}
					>
						<div class="flex h-8 w-full gap-1 overflow-hidden rounded-[3px]">
							<span class="flex-[5]" style:background={preset.build.keycapSet.colors.base}></span>
							<span class="flex-[2]" style:background={preset.build.keycapSet.colors.accent}></span>
							<span class="flex-1" style:background={preset.build.keycapSet.colors.legend}></span>
						</div>
					</div>
					<div class="flex items-baseline justify-between gap-3">
						<h3 class="text-lg font-medium text-ink">{preset.name}</h3>
						<span class="font-mono text-sm text-acid">{formatPrice(preset.price)}</span>
					</div>
					<p class="mt-1 text-sm text-ink-muted">{preset.tagline}</p>
					<p class="mt-3 font-mono text-[10px] text-ink-faint">
						{preset.build.baseKit.name} · {preset.build.switch.name} · {preset.build.keycapSet.name}
					</p>
					<span
						class="mt-4 inline-flex items-center gap-1 font-mono text-[11px] tracking-[0.15em] text-neon uppercase opacity-0 transition-opacity group-hover:opacity-100"
					>
						Öffnen <ArrowRight class="size-3" />
					</span>
				</button>
			{/each}
		</div>
	</div>
</section>

<!-- Teaser Case Study -->
<section class="mx-auto max-w-6xl px-6 py-20">
	<div class="grid items-center gap-10 md:grid-cols-[1fr_auto]">
		<div>
			<p class="font-mono text-[11px] tracking-[0.2em] text-ink-faint uppercase">Für Entwickler</p>
			<h2 class="mt-2 text-2xl font-medium text-ink">Wie das hier gebaut ist</h2>
			<p class="mt-3 max-w-xl text-sm leading-relaxed text-ink-muted">
				Prozedurales 3D ohne ein einziges Modell-Asset, Preise die der Server aus IDs neu rechnet,
				Tastatur-Layouts als Daten, Sound aus Resonatoren. Die Entscheidungen und warum.
			</p>
		</div>
		<Button variant="outline" size="lg" href="/about">
			Case Study lesen
			<ArrowRight data-icon="inline-end" />
		</Button>
	</div>
</section>

<footer class="border-t border-line">
	<div
		class="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-8 font-mono text-[10px] tracking-[0.15em] text-ink-faint uppercase sm:flex-row sm:items-center sm:justify-between"
	>
		<span>Switch<span class="text-neon">Forge</span> · Portfolio-Projekt</span>
		<span>Demo-Shop · Stripe Test-Modus · Es wird nichts berechnet</span>
	</div>
</footer>

<CartDrawer />
