<!--
	Sticky-Preis-Footer: Total immer sichtbar, Aufschlüsselung aufklappbar.
	Primäraktion "In den Warenkorb" – Schritt 3 hängt den Cart-Store dran.
-->
<script lang="ts">
	import { builder, formatPrice } from '$lib/stores/builderState.svelte';
	import ChevronUp from '@lucide/svelte/icons/chevron-up';
	import ShoppingCart from '@lucide/svelte/icons/shopping-cart';

	let { onAddToCart }: { onAddToCart: () => void } = $props();
	let open = $state(false);

	const lines = $derived(
		[
			{ label: builder.baseKit.name, cents: builder.price.baseKit },
			{ label: `Case ${builder.caseColor.name}`, cents: builder.price.caseColor, delta: true },
			{
				label: `${builder.baseKit.keyCount}× ${builder.switch.name}`,
				cents: builder.price.switches
			},
			{ label: `Keycaps ${builder.keycapSet.name}`, cents: builder.price.keycaps },
			{ label: `${builder.plate.name}-Plate`, cents: builder.price.plate, delta: true },
			{ label: `Lighting ${builder.lighting.name}`, cents: builder.price.lighting, delta: true },
			{ label: builder.connectivity.name, cents: builder.price.connectivity, delta: true },
			{ label: `Novelty-Esc ${builder.novelty.name}`, cents: builder.price.novelty, delta: true },
			{ label: `Deskmat ${builder.deskmat.name}`, cents: builder.price.deskmat, delta: true },
			{ label: `Gravur "${builder.engraving}"`, cents: builder.price.engraving, delta: true }
		].filter((l) => !l.delta || l.cents > 0)
	);
</script>

<div
	class="sticky bottom-0 -mx-5 mt-auto -mb-5 rounded-t-2xl border-t border-line bg-void/85 backdrop-blur-md"
>
	{#if open}
		<dl class="space-y-1 border-b border-line/70 px-5 py-3 font-mono text-[11px] text-ink-muted">
			{#each lines as line (line.label)}
				<div class="flex justify-between gap-3">
					<dt class="truncate">{line.label}</dt>
					<dd class="shrink-0">{line.delta ? '+' : ''}{formatPrice(line.cents)}</dd>
				</div>
			{/each}
		</dl>
	{/if}

	<div class="flex items-center gap-3 px-5 py-4">
		<button
			class="group flex min-w-0 flex-1 flex-col items-start text-left"
			onclick={() => (open = !open)}
			aria-expanded={open}
		>
			<span
				class="flex items-center gap-1 font-mono text-[10px] tracking-[0.2em] text-ink-faint uppercase"
			>
				Total
				<ChevronUp
					class={`size-3 transition-transform group-hover:text-ink ${open ? 'rotate-180' : ''}`}
				/>
			</span>
			<span class="text-brand font-display text-xl font-extrabold whitespace-nowrap">
				{formatPrice(builder.price.total)}
			</span>
		</button>
		<button
			class="inline-flex h-10 shrink-0 items-center gap-2 rounded-full bg-brand px-4 text-sm font-semibold text-void shadow-[0_0_24px_oklch(0.72_0.2_20/0.4)] transition-transform hover:scale-[1.03] focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:outline-none"
			onclick={onAddToCart}
		>
			<ShoppingCart class="size-4" />
			In den Warenkorb
		</button>
	</div>
</div>
