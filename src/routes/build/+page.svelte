<script lang="ts">
	import ConfiguratorPanel from '$lib/components/ui/ConfiguratorPanel.svelte';
	import SoundPreview from '$lib/components/ui/SoundPreview.svelte';
	import CartDrawer from '$lib/components/ui/CartDrawer.svelte';
	import PriceSummary from '$lib/components/ui/PriceSummary.svelte';
	import SiteHeader from '$lib/components/ui/SiteHeader.svelte';
	import { builder } from '$lib/stores/builderState.svelte';
	import { cart } from '$lib/stores/cart.svelte';

	function addToCart() {
		cart.add(builder.snapshot());
		cart.open = true;
	}

	// Three.js + Threlte (~600 KB) erst nach dem ersten Paint laden:
	// Header, Panel und Preis sind sofort da, die Szene blendet sich ein.
	const scenePromise = import('$lib/components/3d/Scene.svelte');
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
	class="grid min-h-screen grid-rows-[auto_1fr] lg:h-screen lg:grid-cols-[1fr_400px] lg:grid-rows-[auto_minmax(0,1fr)]"
>
	<div class="lg:col-span-2">
		<SiteHeader compact />
	</div>

	<main class="relative min-h-[55vh]">
		{#await scenePromise}
			<!-- Poster, bis Three.js da ist -->
			<div class="flex h-full w-full items-center justify-center scanlines">
				<span class="animate-pulse font-mono text-[10px] tracking-[0.3em] text-ink-faint uppercase">
					Loading Scene
				</span>
			</div>
		{:then { default: Scene }}
			<Scene transparent />
		{/await}
		<div
			class="pointer-events-none absolute bottom-4 left-4 font-mono text-[10px] tracking-widest text-ink-faint uppercase"
		>
			{builder.label}
		</div>
	</main>

	<aside
		class="flex flex-col gap-5 border-l border-line bg-surface/40 p-6 backdrop-blur-md lg:overflow-y-auto"
	>
		<ConfiguratorPanel />
		<SoundPreview />
		<PriceSummary onAddToCart={addToCart} />
	</aside>
</div>

<CartDrawer />
