<script lang="ts">
	import ConfiguratorPanel from '$lib/components/ui/ConfiguratorPanel.svelte';
	import SoundPreview from '$lib/components/ui/SoundPreview.svelte';
	import CartDrawer from '$lib/components/ui/CartDrawer.svelte';
	import PriceSummary from '$lib/components/ui/PriceSummary.svelte';
	import { builder } from '$lib/stores/builderState.svelte';
	import { cart } from '$lib/stores/cart.svelte';
	import { Button } from '$lib/components/ui/button';
	import ShoppingCart from '@lucide/svelte/icons/shopping-cart';

	function addToCart() {
		cart.add(builder.snapshot());
		cart.open = true;
	}

	// Three.js + Threlte (~600 KB) erst nach dem ersten Paint laden:
	// Header, Panel und Preis sind sofort da, die Szene blendet sich ein.
	const scenePromise = import('$lib/components/3d/Scene.svelte');
</script>

<svelte:head>
	<title>SwitchForge – Custom Mechanical Keyboard Builder</title>
</svelte:head>

<!-- Desktop: feste Viewport-Höhe, Panel scrollt intern. Mobile: Szene oben, Panel darunter. -->
<div
	class="grid min-h-screen grid-rows-[auto_1fr] lg:h-screen lg:grid-cols-[1fr_400px] lg:grid-rows-[auto_minmax(0,1fr)]"
>
	<header class="flex items-center justify-between border-b border-line px-6 py-4 lg:col-span-2">
		<div class="flex items-baseline gap-4">
			<a href="/" class="font-mono text-sm tracking-[0.3em] uppercase">
				Switch<span class="text-neon">Forge</span>
			</a>
			<span
				class="hidden font-mono text-[10px] tracking-[0.15em] text-ink-faint uppercase sm:inline"
			>
				Custom Keyboard Builder
			</span>
		</div>
		<Button
			variant="outline"
			class="hover:border-neon hover:text-neon"
			onclick={() => (cart.open = true)}
		>
			<ShoppingCart data-icon="inline-start" />
			Cart
			{#if cart.count > 0}
				<span class="rounded-full bg-neon px-1.5 font-mono text-[10px] text-void">{cart.count}</span
				>
			{/if}
		</Button>
	</header>

	<main class="relative min-h-[55vh] bg-void">
		{#await scenePromise}
			<!-- Poster, bis Three.js da ist -->
			<div class="flex h-full w-full items-center justify-center scanlines">
				<span class="animate-pulse font-mono text-[10px] tracking-[0.3em] text-ink-faint uppercase">
					Loading Scene
				</span>
			</div>
		{:then { default: Scene }}
			<Scene />
		{/await}
		<div
			class="pointer-events-none absolute bottom-4 left-4 font-mono text-[10px] tracking-widest text-ink-faint uppercase"
		>
			{builder.label}
		</div>
	</main>

	<aside class="flex flex-col gap-5 border-l border-line metallic p-6 lg:overflow-y-auto">
		<ConfiguratorPanel />
		<SoundPreview />
		<PriceSummary onAddToCart={addToCart} />
	</aside>
</div>

<CartDrawer />
