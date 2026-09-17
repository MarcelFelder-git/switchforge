<script lang="ts">
	import SiteHeader from '$lib/components/ui/SiteHeader.svelte';
	import CartDrawer from '$lib/components/ui/CartDrawer.svelte';
	import { Button } from '$lib/components/ui/button';
	import { formatPrice } from '$lib/pricing';
	import { cn } from '$lib/utils';
	import Check from '@lucide/svelte/icons/check';
	import Truck from '@lucide/svelte/icons/truck';

	let { data } = $props();
	const o = $derived(data.order);

	const stepIndex = $derived(o.flow.findIndex((s) => s.id === o.status));
	const cancelled = $derived(o.status === 'cancelled');

	const date = (iso: string) =>
		new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' });
</script>

<svelte:head>
	<title>Bestellung {o.id} – SwitchForge</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<SiteHeader />

<main class="mx-auto max-w-2xl px-6 py-14">
	<p class="font-mono text-[11px] tracking-[0.25em] text-ember uppercase">Bestellung</p>
	<h1 class="mt-2 font-display text-3xl font-extrabold text-ink">{o.id}</h1>
	<p class="mt-1 text-sm text-ink-muted">
		Bestellt am {date(o.createdAt)}{o.customerName ? ` · ${o.customerName}` : ''}
	</p>

	<!-- Timeline -->
	<section class="mt-10 rounded-2xl border border-line bg-surface/50 p-5">
		{#if cancelled}
			<p class="font-display text-xl font-bold text-danger">Storniert</p>
			<p class="mt-1 text-sm text-ink-muted">Diese Bestellung wurde storniert.</p>
		{:else}
			<ol class="grid grid-cols-4 gap-2">
				{#each o.flow as step, i (step.id)}
					{@const done = i <= stepIndex}
					{@const current = i === stepIndex}
					<li class="flex flex-col items-start gap-2">
						<span
							class={cn(
								'flex size-8 items-center justify-center rounded-full border transition-colors',
								done ? 'border-ember bg-brand text-void' : 'border-line text-ink-faint',
								current && 'shadow-[0_0_20px_oklch(0.72_0.19_45/0.45)]'
							)}
						>
							{#if done}<Check class="size-4" />{:else}<span class="font-mono text-[10px]"
									>{i + 1}</span
								>{/if}
						</span>
						<span class={cn('text-xs font-medium', done ? 'text-ink' : 'text-ink-faint')}>
							{step.label}
						</span>
					</li>
				{/each}
			</ol>
			<div class="mt-5 border-t border-line/70 pt-4">
				<p class="font-display text-xl font-bold text-ink">{o.statusLabel}</p>
				<p class="mt-1 text-sm text-ink-muted">
					{#if o.status === 'paid'}
						Eingegangen. Wir starten mit dem Bau – rechne mit zehn Werktagen bis zum Versand.
					{:else if o.status === 'building'}
						Dein Board wird gerade gebaut, geschmiert und getestet.
					{:else if o.status === 'shipped'}
						Unterwegs zu dir.
					{:else}
						Angekommen. Viel Freude damit.
					{/if}
				</p>
				{#if o.trackingNumber}
					<p class="mt-3 flex items-center gap-2 font-mono text-xs text-ink-muted">
						<Truck class="size-4 text-ember" />
						{o.trackingNumber}
						{#if o.trackingUrl}
							· <a
								href={o.trackingUrl}
								class="text-ember hover:underline"
								target="_blank"
								rel="noopener">Sendung verfolgen</a
							>
						{/if}
					</p>
				{/if}
			</div>
		{/if}
	</section>

	<!-- Positionen -->
	<section class="mt-6 rounded-2xl border border-line bg-surface/50">
		<ul class="divide-y divide-line/70">
			{#each o.items as item, i (i)}
				<li class="flex items-start justify-between gap-4 px-5 py-4">
					<div>
						<p class="text-sm font-medium text-ink">{item.label}</p>
						<p class="mt-0.5 font-mono text-[10px] text-ink-faint">
							{item.qty}× · {item.config.languageId === 'de' ? 'Deutsch' : 'English'}
							{#if item.config.engraving}· Gravur „{item.config.engraving}“{/if}
						</p>
					</div>
					<span class="shrink-0 font-mono text-sm text-ink-muted">
						{formatPrice(item.unitCents * item.qty)}
					</span>
				</li>
			{/each}
			<li class="flex items-baseline justify-between px-5 py-4">
				<span class="font-mono text-[10px] tracking-[0.2em] text-ink-faint uppercase">Gesamt</span>
				<span class="text-brand font-display text-lg font-extrabold"
					>{formatPrice(o.amountCents)}</span
				>
			</li>
		</ul>
	</section>

	{#if o.shipping}
		<section class="mt-6 rounded-2xl border border-line bg-surface/50 p-5">
			<p class="font-mono text-[10px] tracking-[0.2em] text-ink-faint uppercase">Lieferadresse</p>
			<p class="mt-2 text-sm text-ink-muted">
				{o.shipping.name}<br />
				{o.shipping.line1}{#if o.shipping.line2}<br />{o.shipping.line2}{/if}<br />
				{o.shipping.postalCode}
				{o.shipping.city}<br />
				{o.shipping.country}
			</p>
		</section>
	{/if}

	<p class="mt-8 font-mono text-[10px] leading-relaxed text-ink-faint">
		Demo-Shop: Diese Bestellung lief im Stripe-Test-Modus. Es wurde nichts berechnet und nichts
		verschickt.
	</p>
	<Button href="/build" variant="outline" class="mt-6 rounded-full">Noch eins bauen</Button>
</main>

<CartDrawer />
