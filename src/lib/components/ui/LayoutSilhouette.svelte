<!--
	Mini-Tastatur als SVG, direkt aus den Layout-Daten. Kein Bild, keine
	Illustration – dieselbe Quelle wie das 3D-Modell.
-->
<script lang="ts">
	import { getLayout } from '$lib/data/layouts';
	import type { LayoutSize } from '$lib/data/catalog';
	import { cn } from '$lib/utils';

	let { size, class: className = '' }: { size: LayoutSize; class?: string } = $props();

	const layout = $derived(getLayout(size, 'en'));
	const GAP = 0.12;
</script>

<svg
	viewBox={`0 0 ${layout.width} ${layout.depth}`}
	class={cn('block h-auto', className)}
	style:aspect-ratio={`${layout.width} / ${layout.depth}`}
	role="img"
	aria-label={`${size} Layout`}
>
	{#each layout.keys as key (key.id)}
		<rect
			x={key.x + layout.width / 2 - key.w / 2 + GAP / 2}
			y={key.z + layout.depth / 2 - 0.5 + GAP / 2}
			width={key.w - GAP}
			height={1 - GAP}
			rx="0.12"
			fill="currentColor"
			opacity={key.accent ? 0.9 : 0.45}
		/>
	{/each}
</svg>
