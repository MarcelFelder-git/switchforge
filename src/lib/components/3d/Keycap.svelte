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

	// Kurze Labels gross (Buchstaben), lange klein (Enter, Bksp, PgUp)
	const fontSize = $derived(def.label.length <= 1 ? 0.24 : 0.14);
	const showLegend = $derived(def.code !== 'Space');

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
		<Text
			text={def.label}
			font={fontUrl}
			{fontSize}
			color={legendColor}
			anchorX="left"
			anchorY="top"
			position={[-def.w / 2 + gap / 2 + 0.12, height / 2 + 0.002, -0.5 + gap / 2 + 0.11]}
			rotation.x={-Math.PI / 2}
			depthOffset={-1}
		/>
	{/if}
</T.Group>
