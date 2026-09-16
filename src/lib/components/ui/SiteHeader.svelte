<!--
	Gemeinsamer Header: Logo, Navigation, Cart-Button mit Zähler.
	`compact` für den Konfigurator (weniger Höhe, keine Nav-Links).
-->
<script lang="ts">
	import { page } from '$app/state';
	import { cart } from '$lib/stores/cart.svelte';
	import { Button } from '$lib/components/ui/button';
	import { cn } from '$lib/utils';
	import ShoppingCart from '@lucide/svelte/icons/shopping-cart';

	let { compact = false }: { compact?: boolean } = $props();

	const links = [
		{ href: '/build', label: 'Konfigurator' },
		{ href: '/about', label: 'How it’s built' }
	];
</script>

<header
	class={cn(
		'flex items-center justify-between border-b border-line px-6',
		compact ? 'py-3' : 'py-4'
	)}
>
	<div class="flex items-baseline gap-6">
		<a href="/" class="font-display text-lg font-extrabold tracking-tight">
			Switch<span class="text-brand">Forge</span>
		</a>
		{#if !compact}
			<nav class="hidden items-baseline gap-5 sm:flex">
				{#each links as link (link.href)}
					<a
						href={link.href}
						class={cn(
							'font-mono text-[11px] tracking-[0.15em] uppercase transition-colors hover:text-ink',
							page.url.pathname.startsWith(link.href) ? 'text-ink' : 'text-ink-muted'
						)}
					>
						{link.label}
					</a>
				{/each}
			</nav>
		{:else}
			<span
				class="hidden font-mono text-[10px] tracking-[0.15em] text-ink-faint uppercase sm:inline"
			>
				Custom Keyboard Builder
			</span>
		{/if}
	</div>

	<Button
		variant="outline"
		class="rounded-full hover:border-ember hover:text-ember"
		onclick={() => (cart.open = true)}
	>
		<ShoppingCart data-icon="inline-start" />
		Cart
		{#if cart.count > 0}
			<span class="rounded-full bg-brand px-1.5 font-mono text-[10px] text-void">{cart.count}</span>
		{/if}
	</Button>
</header>
