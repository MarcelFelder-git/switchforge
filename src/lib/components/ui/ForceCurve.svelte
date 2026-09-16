<!--
	Schematische Kraftkurve eines Switch-Typs: Weg (x) gegen Kraft (y).
	Nicht messgenau, aber ehrlich zum Charakter: linear steigt gleichmäßig,
	tactile hat den Bump, clicky den Bump plus den Klick-Abfall.
-->
<script lang="ts">
	import type { SwitchType } from '$lib/data/catalog';

	let {
		type,
		class: className = '',
		stroke = 3
	}: { type: SwitchType; class?: string; stroke?: number } = $props();

	const curves: Record<SwitchType, string> = {
		linear: 'M0,90 L100,30',
		tactile: 'M0,90 C20,80 26,40 34,38 C40,36 42,60 52,58 L100,28',
		clicky: 'M0,90 C22,82 28,42 36,40 L40,62 L100,30'
	};
	// eindeutige Gradient-ID pro Instanz (SVG-IDs sind dokumentweit)
	const id = `fc-${Math.random().toString(36).slice(2, 8)}`;
</script>

<svg viewBox="0 0 100 100" class={className} aria-hidden="true" preserveAspectRatio="none">
	<defs>
		<linearGradient {id} x1="0" x2="1">
			<stop offset="0" stop-color="oklch(0.62 0.24 300)" />
			<stop offset="1" stop-color="oklch(0.72 0.19 45)" />
		</linearGradient>
	</defs>
	<path d="M0,90 L100,90" stroke="currentColor" stroke-width="1" opacity="0.4" />
	<path
		d={curves[type]}
		fill="none"
		stroke={`url(#${id})`}
		stroke-width={stroke}
		stroke-linecap="round"
		vector-effect="non-scaling-stroke"
	/>
</svg>
