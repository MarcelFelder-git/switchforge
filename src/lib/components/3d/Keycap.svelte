<!--
	Eine Taste: Keycap-Mesh + Legende.
	Geometrie und Material kommen von aussen und werden zwischen allen
	Tasten geteilt (eine Geometrie pro Breite, zwei Materialien pro Set) –
	87 Tasten erzeugen so keine 87 Shader-Kompilierungen.
-->
<script lang="ts">
	import { T } from '@threlte/core';
	import { Text } from '@threlte/extras';
	import type { BufferGeometry, Material, ColorRepresentation } from 'three';
	import type { IntersectionEvent } from '@threlte/extras';
	import type { KeyDef } from '$lib/data/layouts';
	import { keypress } from '$lib/stores/keypress.svelte';
	import fontUrl from '@fontsource/jetbrains-mono/files/jetbrains-mono-latin-500-normal.woff?url';
	// DejaVu-Subset (4 KB) nur für ⌫ ⏎ ⇧ ← → … – JetBrains Mono hat die nicht
	const symbolFontUrl = '/fonts/legend-symbols.woff';

	interface Props {
		def: KeyDef;
		geometry: BufferGeometry;
		material: Material;
		/** String oder Color – Color mit Werten > 1 leuchtet im Bloom (Shine-Through) */
		legendColor: ColorRepresentation;
		/** Keycap-Höhe – für die Legenden-Position auf der Oberseite */
		height: number;
		/** Innenabstand zwischen Keycaps */
		gap: number;
	}

	let { def, geometry, material, legendColor, height, gap }: Props = $props();

	const TRAVEL = 0.16; // Hub beim Drücken, in Units

	const pressed = $derived(keypress.pressed.has(def.id));
	const y = $derived(height / 2 + (pressed ? -TRAVEL : 0));

	// Buchstaben und Symbole gross, Wörter (Esc, Strg, F12) klein.
	// Lange Wörter (Rollen, Einfg) müssen auf 1u passen → noch kleiner.
	const fontSize = $derived(
		def.symbol ? 0.26 : def.label.length <= 1 ? 0.24 : def.label.length <= 4 ? 0.14 : 0.115
	);
	const showLegend = $derived(def.code !== 'Space');
	// Oberseite ist durch die Verjüngung etwas kleiner als die Grundfläche
	const top = $derived(height / 2 + 0.002);
	const TAPER = 0.16;
	const topW = $derived((def.w - gap) * (1 - TAPER));

	function setCursor(cursor: string) {
		document.body.style.cursor = cursor;
	}
</script>

<T.Group position={[def.x, y, def.z]}>
	<T.Mesh
		{geometry}
		{material}
		castShadow
		receiveShadow
		onpointerdown={(e: IntersectionEvent<PointerEvent>) => {
			e.stopPropagation();
			keypress.press(def.id);
		}}
		onpointerup={() => keypress.release(def.id)}
		onpointerleave={() => {
			keypress.release(def.id);
			setCursor('auto');
		}}
		onpointerenter={() => setCursor('pointer')}
	/>

	{#if showLegend}
		{#if def.shiftLabel}
			<!-- Zweitbelegung oben, Hauptlegende darunter – wie auf echten Kappen -->
			<Text
				text={def.shiftLabel}
				font={fontUrl}
				fontSize={0.17}
				color={legendColor}
				anchorX="center"
				anchorY="middle"
				position={[0, top, -0.15]}
				rotation.x={-Math.PI / 2}
				depthOffset={-1}
			/>
			<Text
				text={def.label}
				font={def.symbol ? symbolFontUrl : fontUrl}
				fontSize={0.17}
				color={legendColor}
				anchorX="center"
				anchorY="middle"
				position={[0, top, 0.13]}
				rotation.x={-Math.PI / 2}
				depthOffset={-1}
			/>
		{:else}
			<Text
				text={def.label}
				font={def.symbol ? symbolFontUrl : fontUrl}
				{fontSize}
				color={legendColor}
				anchorX="center"
				anchorY="middle"
				position={[def.subLabel ? -0.07 : 0, top, 0]}
				rotation.x={-Math.PI / 2}
				depthOffset={-1}
			/>
			{#if def.subLabel}
				<!-- kleines Symbol rechts neben dem Wort (Bild ↑) -->
				<Text
					text={def.subLabel}
					font={symbolFontUrl}
					fontSize={0.14}
					color={legendColor}
					anchorX="center"
					anchorY="middle"
					position={[topW / 2 - 0.1, top, 0]}
					rotation.x={-Math.PI / 2}
					depthOffset={-1}
				/>
			{/if}
		{/if}
	{/if}
</T.Group>
