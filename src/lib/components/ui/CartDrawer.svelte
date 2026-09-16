<!--
	Warenkorb-Drawer (Shadcn Sheet).
	Liest/schreibt nur den cart-Store; der Checkout-Request schickt IDs + Mengen,
	die Antwort ist eine Stripe-URL, zu der wir navigieren.
-->
<script lang="ts">
	import * as Sheet from '$lib/components/ui/sheet';
	import { Button } from '$lib/components/ui/button';
	import { cart } from '$lib/stores/cart.svelte';
	import { builder, formatPrice } from '$lib/stores/builderState.svelte';
	import Minus from '@lucide/svelte/icons/minus';
	import Plus from '@lucide/svelte/icons/plus';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import Pencil from '@lucide/svelte/icons/pencil';
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import { goto } from '$app/navigation';

	let checkingOut = $state(false);
	let errorMsg = $state<string | null>(null);

	async function checkout() {
		checkingOut = true;
		errorMsg = null;
		try {
			const res = await fetch('/api/checkout', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(cart.toCheckoutPayload())
			});
			const data = await res.json().catch(() => ({}));
			if (!res.ok) throw new Error(data.message ?? `Checkout fehlgeschlagen (${res.status})`);
			window.location.href = data.url;
		} catch (err) {
			errorMsg = err instanceof Error ? err.message : 'Checkout fehlgeschlagen';
			checkingOut = false;
		}
	}

	function edit(id: string) {
		const item = cart.items.find((i) => i.id === id);
		if (!item) return;
		builder.load(item.config);
		cart.open = false;
		goto('/build');
	}
</script>

<Sheet.Root bind:open={cart.open}>
	<Sheet.Content side="right" class="border-line bg-surface sm:max-w-md">
		<Sheet.Header>
			<Sheet.Title class="font-display text-lg font-bold">
				Cart
				{#if cart.count > 0}
					<span class="ml-2 text-ember">{cart.count}</span>
				{/if}
			</Sheet.Title>
			<Sheet.Description class="font-mono text-[11px] text-ink-faint">
				{cart.count === 0 ? 'Noch nichts drin.' : 'Jede Zeile ist eine eigene Konfiguration.'}
			</Sheet.Description>
		</Sheet.Header>

		<div class="flex-1 overflow-y-auto px-4">
			{#if cart.lines.length === 0}
				<div class="rounded-panel border border-dashed border-line p-6 text-center">
					<p class="text-sm text-ink-muted">Konfiguriere ein Keyboard und leg es hier ab.</p>
					<Button
						variant="outline"
						class="mt-4"
						onclick={() => {
							cart.open = false;
							goto('/build');
						}}
					>
						Zum Konfigurator
					</Button>
				</div>
			{:else}
				<ul class="flex flex-col gap-3">
					{#each cart.lines as line (line.id)}
						<li class="rounded-panel border border-line bg-void/50 p-3">
							<div class="flex items-start gap-3">
								<!-- Mini-Vorschau: Case-Farbe + Keycap-Farben -->
								<span
									class="flex h-9 w-12 shrink-0 items-end justify-center rounded-sm border border-line p-1"
									style:background={line.build.caseColor.hex}
								>
									<span class="flex h-3 w-full overflow-hidden rounded-[2px]">
										<span class="flex-[3]" style:background={line.build.keycapSet.colors.base}
										></span>
										<span class="flex-1" style:background={line.build.keycapSet.colors.accent}
										></span>
									</span>
								</span>
								<div class="min-w-0 flex-1">
									<p class="text-sm font-medium text-ink">{line.build.baseKit.name}</p>
									<p class="font-mono text-[10px] leading-relaxed text-ink-muted">
										{line.build.caseColor.name} · {line.build.switch.name} · {line.build.keycapSet
											.name} · {line.build.plate.name}
										{#if line.build.lighting.mode !== 'none'}
											· {line.build.lighting.name}
										{/if}
										{#if line.build.connectivity.mode === 'wireless'}
											· Wireless
										{/if}
									</p>
								</div>
								<span class="shrink-0 font-mono text-sm text-ink">
									{formatPrice(line.lineCents)}
								</span>
							</div>

							<div class="mt-3 flex items-center justify-between">
								<div class="flex items-center gap-1">
									<Button
										variant="outline"
										size="icon-sm"
										aria-label="Weniger"
										onclick={() => cart.setQty(line.id, line.qty - 1)}
									>
										<Minus />
									</Button>
									<span class="w-6 text-center font-mono text-xs">{line.qty}</span>
									<Button
										variant="outline"
										size="icon-sm"
										aria-label="Mehr"
										disabled={line.qty >= 10}
										onclick={() => cart.setQty(line.id, line.qty + 1)}
									>
										<Plus />
									</Button>
								</div>
								<div class="flex items-center gap-1">
									<Button
										variant="ghost"
										size="icon-sm"
										aria-label="Im Konfigurator öffnen"
										title="Im Konfigurator öffnen"
										onclick={() => edit(line.id)}
									>
										<Pencil />
									</Button>
									<Button
										variant="ghost"
										size="icon-sm"
										aria-label="Entfernen"
										class="hover:text-danger"
										onclick={() => cart.remove(line.id)}
									>
										<Trash2 />
									</Button>
								</div>
							</div>
						</li>
					{/each}
				</ul>
			{/if}
		</div>

		{#if cart.lines.length > 0}
			<Sheet.Footer class="border-t border-line">
				<div class="flex items-baseline justify-between">
					<span class="font-mono text-[10px] tracking-[0.2em] text-ink-faint uppercase">Total</span>
					<span class="text-brand font-display text-xl font-extrabold">
						{formatPrice(cart.totalCents)}
					</span>
				</div>
				<p class="font-mono text-[10px] text-ink-faint">Versand wird bei Stripe berechnet.</p>
				{#if errorMsg}
					<p
						class="rounded-panel border border-danger/40 bg-danger/10 p-2 font-mono text-[11px] text-danger"
					>
						{errorMsg}
					</p>
				{/if}
				<button
					class="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-brand text-sm font-semibold text-void shadow-[0_0_24px_oklch(0.72_0.2_20/0.4)] transition-transform hover:scale-[1.02] disabled:opacity-60 disabled:hover:scale-100"
					disabled={checkingOut}
					onclick={checkout}
				>
					{checkingOut ? 'Weiter zu Stripe …' : 'Zur Kasse'}
					<ArrowRight class="size-4" />
				</button>
			</Sheet.Footer>
		{/if}
	</Sheet.Content>
</Sheet.Root>
