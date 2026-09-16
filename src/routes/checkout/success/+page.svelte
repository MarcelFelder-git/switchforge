<script lang="ts">
	import { cart } from '$lib/stores/cart.svelte';
	import { formatPrice } from '$lib/stores/builderState.svelte';
	import { Button } from '$lib/components/ui/button';
	import Check from '@lucide/svelte/icons/check';

	let { data } = $props();

	// Bezahlt → Cart leeren. Läuft nur im Browser, einmal beim Mount.
	$effect(() => {
		if (data.paid) cart.clear();
	});
</script>

<svelte:head>
	<title>Bestellung bestätigt – SwitchForge</title>
</svelte:head>

<div class="flex min-h-screen flex-col">
	<header class="border-b border-line px-6 py-4">
		<a href="/" class="font-mono text-sm tracking-[0.3em] uppercase">
			Switch<span class="text-neon">Forge</span>
		</a>
	</header>

	<main class="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center gap-8 px-6 py-16">
		<div class="flex items-center gap-4">
			<span
				class="flex size-12 items-center justify-center rounded-full border border-acid bg-acid/10 text-acid shadow-glow-acid"
			>
				<Check class="size-6" />
			</span>
			<div>
				<h1 class="text-xl font-medium">
					{data.paid ? 'Bestellung bestätigt' : 'Zahlung ausstehend'}
				</h1>
				<p class="font-mono text-[11px] text-ink-faint">{data.orderId}</p>
			</div>
		</div>

		<p class="text-sm text-ink-muted">
			{#if data.paid}
				Danke{data.name ? `, ${data.name}` : ''}. Die Bestätigung geht an
				<span class="text-ink">{data.email ?? 'deine E-Mail'}</span>.
			{:else}
				Die Zahlung ist noch nicht abgeschlossen. Sobald Stripe bestätigt, ist die Bestellung
				gültig.
			{/if}
		</p>

		<ul class="divide-y divide-line/70 rounded-panel border border-line bg-surface/70">
			{#each data.items as item (item.name + item.qty)}
				<li class="flex items-start justify-between gap-4 px-4 py-3 text-sm">
					<span>
						<span class="block text-ink">{item.name}</span>
						<span class="block font-mono text-[10px] text-ink-faint">{item.qty}×</span>
					</span>
					<span class="shrink-0 font-mono text-ink-muted">{formatPrice(item.amountCents)}</span>
				</li>
			{/each}
			<li class="flex items-baseline justify-between px-4 py-3">
				<span class="font-mono text-[10px] tracking-[0.2em] text-ink-faint uppercase">Total</span>
				<span class="font-mono text-lg text-acid">{formatPrice(data.amountCents)}</span>
			</li>
		</ul>

		<p class="font-mono text-[10px] leading-relaxed text-ink-faint">
			Demo-Shop: Diese Bestellung lief im Stripe-Test-Modus. Es wurde nichts berechnet und nichts
			verschickt.
		</p>

		<Button href="/build" variant="outline" class="self-start">Noch eins bauen</Button>
	</main>
</div>
