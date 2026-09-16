<!--
	Keyboard-Mesh, prozedural aus dem Layout des gewählten Base-Kits.

	Reaktivität in drei Stufen, jede so billig wie möglich:
	- Layout-Wechsel  → Geometrien neu (selten)
	- Farb-Wechsel    → nur material.color.set() + invalidate()
	- Tastendruck     → nur position.y der einen Taste (über keypress-Store)

	Threlte rendert on-demand: Wer ein Material direkt anfasst, muss
	invalidate() rufen, sonst bleibt das alte Bild stehen, bis irgendwas
	anderes einen Frame auslöst.
-->
<script lang="ts">
	import { T, useThrelte, useTask } from '@threlte/core';
	import { interactivity } from '@threlte/extras';
	import {
		MeshStandardMaterial,
		MeshPhysicalMaterial,
		Color,
		CanvasTexture,
		RepeatWrapping,
		SRGBColorSpace
	} from 'three';
	import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
	import { builder } from '$lib/stores/builderState.svelte';
	import { layouts } from '$lib/data/layouts';
	import Keycap from './Keycap.svelte';

	interactivity();
	const { invalidate } = useThrelte();

	// --- Masse in Units (1u = 19.05 mm) ---
	const GAP = 0.1; // Spalt zwischen Keycaps
	const KEY_H = 0.42;
	const CASE_MARGIN = 0.45;
	const CASE_H = 0.85;
	const PLATE_H = 0.06;

	const layout = $derived(layouts[builder.baseKit.layout]);
	const caseW = $derived(layout.width + CASE_MARGIN * 2);
	const caseD = $derived(layout.depth + CASE_MARGIN * 2);

	// --- Geometrien: eine pro Keycap-Breite, geteilt über alle Tasten ---
	const keyGeometries = $derived.by(() => {
		const map = new Map<number, RoundedBoxGeometry>();
		for (const key of layout.keys) {
			if (!map.has(key.w)) {
				map.set(key.w, new RoundedBoxGeometry(key.w - GAP, KEY_H, 1 - GAP, 3, 0.07));
			}
		}
		return map;
	});

	const caseGeometry = $derived(new RoundedBoxGeometry(caseW, CASE_H, caseD, 4, 0.18));

	// Alte Geometrien freigeben, wenn das Layout wechselt
	$effect(() => {
		const geos = [...keyGeometries.values(), caseGeometry];
		return () => geos.forEach((g) => g.dispose());
	});

	// --- Materialien: geteilt, Farben werden per Effect nachgeführt ---
	const keyBaseMat = new MeshStandardMaterial({ roughness: 0.55, metalness: 0 });
	const keyAccentMat = new MeshStandardMaterial({ roughness: 0.55, metalness: 0 });
	const caseMat = new MeshPhysicalMaterial({
		roughness: 0.32,
		metalness: 0.75,
		clearcoat: 0.4,
		clearcoatRoughness: 0.3
	});
	const plateMat = new MeshStandardMaterial({ roughness: 0.28, metalness: 0.95 });
	const underglowMat = new MeshStandardMaterial({ emissiveIntensity: 2.5, color: '#000000' });
	const portMat = new MeshStandardMaterial({ color: '#0a0a0c', roughness: 0.7, metalness: 0.3 });
	const portRimMat = new MeshStandardMaterial({ color: '#c8ccd2', roughness: 0.35, metalness: 1 });
	const footMat = new MeshStandardMaterial({ color: '#1a1a1d', roughness: 0.95 });

	const PLATE_COLORS = { aluminium: '#9aa0a8', brass: '#c9a227', polycarbonate: '#dfe6ee' };

	$effect(() => {
		keyBaseMat.color.set(builder.keycapSet.colors.base);
		keyAccentMat.color.set(builder.keycapSet.colors.accent);
		invalidate();
	});
	$effect(() => {
		caseMat.color.set(builder.caseColor.hex);
		invalidate();
	});
	$effect(() => {
		const c = PLATE_COLORS[builder.plate.material];
		plateMat.color.set(c);
		plateMat.roughness = builder.plate.material === 'polycarbonate' ? 0.5 : 0.28;
		plateMat.metalness = builder.plate.material === 'polycarbonate' ? 0.1 : 0.95;
		invalidate();
	});
	$effect(() => {
		// Underglow nimmt die Akzentfarbe des Keycap-Sets – kleines Farb-Matching
		underglowMat.emissive = new Color(builder.keycapSet.colors.accent);
		invalidate();
	});

	// --- Beleuchtung ---
	// Die Platte leuchtet zwischen den Tasten durch – so sieht Backlight auf
	// echten Boards aus. RGB: eine 1-px-hohe Regenbogen-Textur als emissiveMap,
	// deren Offset pro Frame wandert → Farbwelle über das ganze Board.
	const rainbow = (() => {
		const canvas = document.createElement('canvas');
		canvas.width = 256;
		canvas.height = 1;
		const ctx = canvas.getContext('2d')!;
		const grad = ctx.createLinearGradient(0, 0, 256, 0);
		for (let i = 0; i <= 6; i++) grad.addColorStop(i / 6, `hsl(${(i * 60) % 360} 100% 55%)`);
		ctx.fillStyle = grad;
		ctx.fillRect(0, 0, 256, 1);
		const tex = new CanvasTexture(canvas);
		tex.wrapS = RepeatWrapping;
		tex.colorSpace = SRGBColorSpace;
		return tex;
	})();

	const lightingMode = $derived(builder.lighting.mode);

	$effect(() => {
		if (lightingMode === 'rgb') {
			plateMat.emissive.set('#ffffff');
			plateMat.emissiveMap = rainbow;
			plateMat.emissiveIntensity = 1.4;
		} else if (lightingMode === 'white') {
			plateMat.emissive.set('#fff3d6');
			plateMat.emissiveMap = null;
			plateMat.emissiveIntensity = 0.9;
		} else {
			plateMat.emissive.set('#000000');
			plateMat.emissiveMap = null;
			plateMat.emissiveIntensity = 0;
		}
		plateMat.needsUpdate = true; // Map hinzufügen/entfernen ändert den Shader
		invalidate();
	});

	// useTask invalidiert automatisch pro Frame; nur laufen lassen, wenn RGB an ist
	const wave = useTask(
		(delta) => {
			rainbow.offset.x = (rainbow.offset.x + delta * 0.25) % 1;
		},
		{ autoStart: false }
	);
	$effect(() => {
		if (lightingMode === 'rgb') wave.start();
		else wave.stop();
	});

	const underglow = $derived(builder.keycapSet.colors.accent);
	const backlightColor = $derived(lightingMode === 'white' ? '#fff3d6' : '#ffffff');
</script>

<T.Group>
	<!-- Gehäuse: Oberkante bei y=0, Tasten sitzen darauf -->
	<T.Mesh geometry={caseGeometry} material={caseMat} position.y={-CASE_H / 2} receiveShadow />

	<!-- USB-C-Port hinten mittig: dunkle Buchse mit Metallrahmen -->
	<T.Group position={[0, -CASE_H * 0.45, -caseD / 2]}>
		<T.Mesh material={portRimMat} position.z={-0.01}>
			<T.BoxGeometry args={[0.72, 0.3, 0.06]} />
		</T.Mesh>
		<T.Mesh material={portMat} position.z={-0.02}>
			<T.BoxGeometry args={[0.6, 0.2, 0.08]} />
		</T.Mesh>
	</T.Group>

	<!-- Gummifüsse an den vier Ecken -->
	{#each [-1, 1] as sx (sx)}
		{#each [-1, 1] as sz (sz)}
			<T.Mesh
				material={footMat}
				position={[sx * (caseW / 2 - 0.9), -CASE_H - 0.03, sz * (caseD / 2 - 0.6)]}
			>
				<T.CylinderGeometry args={[0.28, 0.28, 0.06, 16]} />
			</T.Mesh>
		{/each}
	{/each}

	<!-- Platte, sichtbar in den Spalten zwischen den Tasten (trägt das Backlight) -->
	<T.Mesh material={plateMat} position.y={PLATE_H / 2} receiveShadow>
		<T.BoxGeometry args={[layout.width + 0.1, PLATE_H, layout.depth + 0.1]} />
	</T.Mesh>

	<!-- Backlight-Schein auf die Keycap-Unterseiten -->
	{#if lightingMode !== 'none'}
		<T.PointLight position={[0, 0.3, 0]} color={backlightColor} intensity={4} distance={6} />
	{/if}

	<!-- Tasten -->
	<T.Group position.y={PLATE_H}>
		{#each layout.keys as key (key.id)}
			<Keycap
				def={key}
				geometry={keyGeometries.get(key.w)!}
				material={key.accent ? keyAccentMat : keyBaseMat}
				legendColor={builder.keycapSet.colors.legend}
				height={KEY_H}
				gap={GAP}
			/>
		{/each}
	</T.Group>

	<!-- Underglow: leuchtender Streifen unter dem Case + Licht auf den Boden -->
	<T.Mesh material={underglowMat} position.y={-CASE_H - 0.01} rotation.x={-Math.PI / 2}>
		<T.PlaneGeometry args={[caseW + 0.16, caseD + 0.16]} />
	</T.Mesh>
	<T.PointLight
		position={[0, -CASE_H + 0.2, 0]}
		color={underglow}
		intensity={12}
		distance={8}
		decay={2}
	/>

	<!-- Boden: fängt Schatten und Underglow -->
	<T.Mesh position.y={-CASE_H - 0.06} rotation.x={-Math.PI / 2} receiveShadow>
		<T.PlaneGeometry args={[80, 80]} />
		<T.MeshStandardMaterial color="#0b0b0f" roughness={0.9} metalness={0.05} />
	</T.Mesh>
</T.Group>
