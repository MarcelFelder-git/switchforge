<!--
	Kamera, die das Keyboard immer ganz ins Bild bekommt.
	Rechnet die Distanz aus Layout-Breite, FOV und Seitenverhältnis des
	Canvas – so passt TKL auf dem Desktop genauso wie 60 % im Hochformat.
-->
<script lang="ts">
	import { T, useThrelte } from '@threlte/core';
	import { OrbitControls } from '@threlte/extras';
	import type { PerspectiveCamera } from 'three';
	import { builder, type BuilderState } from '$lib/stores/builderState.svelte';
	import { getLayout } from '$lib/data/layouts';

	let {
		build = builder,
		autoRotate = false,
		shiftX = 0,
		shiftY = 0
	}: {
		build?: BuilderState;
		autoRotate?: boolean;
		/** Bild horizontal verschieben, Anteil der Breite (0.2 = Board rückt nach rechts) */
		shiftX?: number;
		/** Bild vertikal verschieben, Anteil der Höhe (0.2 = Board rückt nach unten) */
		shiftY?: number;
	} = $props();

	let camera = $state<PerspectiveCamera>();

	// View-Offset statt Modell verschieben: die Orbit-Rotation kreist weiter
	// um das Board, nur die Projektion wandert – wie ein Shift-Objektiv.
	$effect(() => {
		if (!camera) return;
		const w = $size.width;
		const h = $size.height;
		if (shiftX || shiftY) camera.setViewOffset(w, h, -shiftX * w, -shiftY * h, w, h);
		else camera.clearViewOffset();
	});

	const FOV = 32;
	/** Luft links/rechts, damit das Case nicht am Rand klebt */
	const MARGIN = 1.3;
	/** Blickrichtung: von vorne oben, normalisiert */
	const DIR = { y: 0.6, z: 0.8 };

	const { size } = useThrelte();

	// Deskmat macht das Motiv breiter – die Matte darf angeschnitten sein
	const width = $derived(
		getLayout(build.baseKit.layout, build.language.id).width +
			(build.deskmat.style !== 'none' ? 4 : 0)
	);
	const aspect = $derived($size.height > 0 ? $size.width / $size.height : 1.5);

	// Sichtbare Breite bei Distanz d: 2 · d · tan(fov/2) · aspect
	// → umgestellt nach d für die gewünschte Breite
	const distance = $derived.by(() => {
		const halfFov = (FOV / 2) * (Math.PI / 180);
		const needed = (width * MARGIN) / 2 / (Math.tan(halfFov) * aspect);
		// nie näher als "Tiefe passt", sonst schneidet das Hochformat oben ab
		return Math.max(needed, width * 0.9);
	});

	const position = $derived<[number, number, number]>([0, distance * DIR.y, distance * DIR.z]);
</script>

<T.PerspectiveCamera makeDefault {position} fov={FOV} bind:ref={camera}>
	<OrbitControls
		{autoRotate}
		autoRotateSpeed={0.6}
		enableDamping
		enablePan={false}
		minDistance={distance * 0.45}
		maxDistance={distance * 1.6}
		maxPolarAngle={Math.PI / 2.15}
		target={[0, 0, 0.5]}
	/>
</T.PerspectiveCamera>
