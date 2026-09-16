<!--
	Warenkorb-Drawer auf Basis des Shadcn-Sheets.
	TODO Schritt 3: cartState.svelte.ts (persistente Line-Items aus
	BuildConfig-Snapshots), POST /api/checkout.
-->
<script lang="ts">
	import * as Sheet from '$lib/components/ui/sheet';
	import { builder, formatPrice } from '$lib/stores/builderState.svelte';

	let { open = $bindable(false) }: { open?: boolean } = $props();
</script>

<Sheet.Root bind:open>
	<Sheet.Content side="right" class="border-line bg-surface">
		<Sheet.Header>
			<Sheet.Title class="font-mono text-sm tracking-[0.2em] uppercase">Cart</Sheet.Title>
			<Sheet.Description class="font-mono text-xs text-ink-faint">
				Noch leer. Der Cart kommt in Schritt 3.
			</Sheet.Description>
		</Sheet.Header>

		<div class="px-4 font-mono text-xs text-ink-muted">
			<p class="mb-1 text-ink-faint">Aktuelle Konfiguration:</p>
			<p>{builder.label}</p>
			<p class="mt-2 text-acid">{formatPrice(builder.price.total)}</p>
		</div>
	</Sheet.Content>
</Sheet.Root>
