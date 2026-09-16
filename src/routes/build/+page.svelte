<script lang="ts">
	import { Tween } from 'svelte/motion';
	import { cubicInOut } from 'svelte/easing';
	import ConfiguratorPanel from '$lib/components/ui/ConfiguratorPanel.svelte';
	import SoundPreview from '$lib/components/ui/SoundPreview.svelte';
	import CartDrawer from '$lib/components/ui/CartDrawer.svelte';
	import PriceSummary from '$lib/components/ui/PriceSummary.svelte';
	import SiteHeader from '$lib/components/ui/SiteHeader.svelte';
	import { builder } from '$lib/stores/builderState.svelte';
	import { cart } from '$lib/stores/cart.svelte';
	import { cn } from '$lib/utils';
	import Dices from '@lucide/svelte/icons/dices';
	import RotateCcw from '@lucide/svelte/icons/rotate-ccw';

	function addToCart() {
		cart.add(builder.snapshot());
		cart.open = true;
	}

	// Three.js + Threlte (~600 KB) erst nach dem ersten Paint laden:
	// Header, Panel und Preis sind sofort da, die Szene blendet sich ein.
	const scenePromise = import('$lib/components/3d/Scene.svelte');

	// Ansichten: feste Kamerawinkel, weich angefahren. OrbitControls liest die
	// Kameraposition jeden Frame neu, deshalb kann man danach normal weiterdrehen.
	const views = [
		{ id: 'front', label: 'Front', azimuth: 0, elevation: 37, zoom: 1 },
		{ id: 'side', label: 'Seite', azimuth: 62, elevation: 12, zoom: 0.72 },
		{ id: 'rear', label: 'Hinten', azimuth: 165, elevation: 18, zoom: 0.8 },
		{ id: 'top', label: 'Oben', azimuth: 0, elevation: 80, zoom: 0.85 }
	];
	let view = $state('front');
	const opts = { duration: 900, easing: cubicInOut };
	const az = new Tween(0, opts);
	const el = new Tween(37, opts);
	const zoom = new Tween(1, opts);
	function setView(id: string) {
		const v = views.find((x) => x.id === id);
		if (!v) return;
		view = id;
		az.set(v.azimuth);
		el.set(v.elevation);
		zoom.set(v.zoom);
	}
</script>

<svelte:head>
	<title>Konfigurator – SwitchForge</title>
	<meta
		name="description"
		content="Baue dein mechanisches Keyboard in 3D: Layout, Case, Switches, Keycaps, Beleuchtung – mit Live-Preis und Sound-Vorschau."
	/>
</svelte:head>

<!-- Desktop: feste Viewport-Höhe, Panel scrollt intern. Mobile: Szene oben, Panel darunter. -->
<div
	class="grid min-h-screen grid-rows-[auto_1fr] lg:h-screen lg:grid-cols-[1fr_420px] lg:grid-rows-[auto_minmax(0,1fr)]"
>
	<div class="lg:col-span-2">
		<SiteHeader compact />
	</div>

	<main class="relative min-h-[55vh]">
		{#await scenePromise}
			<div class="flex h-full w-full items-center justify-center">
				<span class="animate-pulse font-mono text-[10px] tracking-[0.3em] text-ink-faint uppercase">
					Loading Scene
				</span>
			</div>
		{:then { default: Scene }}
			<Scene transparent azimuth={az.current} elevation={el.current} zoom={zoom.current} />
		{/await}

		<!-- Ansichten -->
		<div
			class="absolute top-4 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full border border-line bg-void/50 p-1 backdrop-blur"
		>
			{#each views as v (v.id)}
				<button
					class={cn(
						'rounded-full px-3 py-1 font-mono text-[10px] tracking-[0.15em] uppercase transition-colors',
						view === v.id ? 'bg-brand text-void' : 'text-ink-muted hover:text-ink'
					)}
					onclick={() => setView(v.id)}
				>
					{v.label}
				</button>
			{/each}
		</div>

		<!-- Spec-Zeile: was gerade gebaut wird -->
		<div
			class="pointer-events-none absolute right-6 bottom-4 left-6 flex flex-wrap items-center gap-2 font-mono text-[10px] tracking-[0.15em] text-ink-faint uppercase"
		>
			<span class="text-ink">{builder.baseKit.name}</span>
			<span>·</span>
			<span>{builder.caseColor.name}</span>
			<span>·</span>
			<span>{builder.switch.name}</span>
			<span>·</span>
			<span>{builder.keycapSet.name}</span>
			<span>·</span>
			<span>{builder.plate.name}</span>
			<span class="ml-auto hidden sm:inline">Ziehen zum Drehen · Scrollen zum Zoomen</span>
		</div>
	</main>

	<aside
		class="flex flex-col gap-5 border-l border-line bg-surface/40 p-6 backdrop-blur-md lg:overflow-y-auto"
	>
		<!-- Kopf: Titel + Würfeln/Zurücksetzen -->
		<div class="flex items-end justify-between gap-4 border-b border-line/70 pb-5">
			<div>
				<p class="font-mono text-[10px] tracking-[0.25em] text-ember uppercase">Konfigurator</p>
				<h1 class="mt-1 font-display text-2xl font-extrabold text-ink">Dein Build.</h1>
			</div>
			<div class="flex items-center gap-1.5">
				<button
					class="inline-flex h-9 items-center gap-1.5 rounded-full border border-line bg-void/40 px-3 font-mono text-[10px] tracking-[0.15em] text-ink-muted uppercase transition-colors hover:border-ember hover:text-ink"
					title="Zufälliger Build"
					onclick={() => builder.randomize()}
				>
					<Dices class="size-3.5" />
					Würfeln
				</button>
				<button
					class="inline-flex size-9 items-center justify-center rounded-full border border-line bg-void/40 text-ink-muted transition-colors hover:border-ember hover:text-ink"
					title="Zurücksetzen"
					aria-label="Zurücksetzen"
					onclick={() => builder.reset()}
				>
					<RotateCcw class="size-3.5" />
				</button>
			</div>
		</div>

		<ConfiguratorPanel />
		<SoundPreview />
		<PriceSummary onAddToCart={addToCart} />
	</aside>
</div>

<CartDrawer />
