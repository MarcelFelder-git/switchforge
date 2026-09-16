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
	import { interactivity, Text } from '@threlte/extras';
	import type { IntersectionEvent } from '@threlte/extras';
	import {
		MeshStandardMaterial,
		MeshPhysicalMaterial,
		Color,
		CanvasTexture,
		RepeatWrapping,
		SRGBColorSpace,
		Vector3
	} from 'three';
	import { builder, type BuilderState } from '$lib/stores/builderState.svelte';
	import { getLayout, type KeyDef } from '$lib/data/layouts';
	import { caseGeometry, seamGeometry, keycapGeometry, coiledCableGeometry } from './geometry';
	import Keycap from './Keycap.svelte';
	import fontUrl from '@fontsource/jetbrains-mono/files/jetbrains-mono-latin-500-normal.woff?url';

	/** Welcher State gerendert wird – Standard ist der Konfigurator, die Landing bringt ihren eigenen */
	let {
		build = builder,
		ground = true,
		underglow = true
	}: { build?: BuilderState; ground?: boolean; underglow?: boolean } = $props();

	interactivity();
	const { invalidate } = useThrelte();

	// --- Masse in Units (1u = 19.05 mm) ---
	const GAP = 0.1; // Spalt zwischen Keycaps
	const KEY_H = 0.42;
	const CASE_MARGIN = 0.45;
	const CASE_H = 0.85;
	const PLATE_H = 0.06;
	const GROUND_Y = -CASE_H - 0.06;

	const layout = $derived(getLayout(build.baseKit.layout, build.language.id));
	const wireless = $derived(build.connectivity.mode === 'wireless');
	const lightingMode = $derived(build.lighting.mode);
	const deskmat = $derived(build.deskmat.style);

	const caseW = $derived(layout.width + CASE_MARGIN * 2);
	const caseD = $derived(layout.depth + CASE_MARGIN * 2);
	const caseX = 0;
	const rearZ = $derived(-caseD / 2);

	// --- Geometrien: geteilt, bei Layout-Wechsel neu ---
	const keyGeometries = $derived.by(() => {
		const map = new Map<number, ReturnType<typeof keycapGeometry>>();
		for (const key of layout.keys) {
			if (!map.has(key.w)) map.set(key.w, keycapGeometry(key.w, KEY_H, GAP));
		}
		return map;
	});
	const caseGeo = $derived(caseGeometry(caseW, caseD, CASE_H));
	const seamGeo = $derived(seamGeometry(caseW + 0.05, caseD + 0.05, 0.06));
	const cableGeo = $derived(
		coiledCableGeometry(new Vector3(caseX, -CASE_H * 0.45, rearZ - 0.04), GROUND_Y)
	);
	const matW = $derived(caseW + 9);
	const matD = $derived(caseD + 3.6);

	$effect(() => {
		const geos = [...keyGeometries.values(), caseGeo, seamGeo, cableGeo];
		return () => geos.forEach((g) => g.dispose());
	});

	// --- Materialien: geteilt, Farben werden per Effect nachgeführt ---
	const keyBaseMat = new MeshStandardMaterial({ roughness: 0.55, metalness: 0 });
	const keyAccentMat = new MeshStandardMaterial({ roughness: 0.55, metalness: 0 });
	const keyNoveltyMat = new MeshStandardMaterial({ roughness: 0.5, metalness: 0 });
	const caseMat = new MeshPhysicalMaterial({
		roughness: 0.32,
		metalness: 0.75,
		clearcoat: 0.4,
		clearcoatRoughness: 0.3
	});
	const metalMat = new MeshStandardMaterial({ roughness: 0.3, metalness: 1 }); // Seam, Badge
	const plateMat = new MeshStandardMaterial({ roughness: 0.28, metalness: 0.95 });
	const underglowMat = new MeshStandardMaterial({ emissiveIntensity: 2.5, color: '#000000' });
	const portMat = new MeshStandardMaterial({ color: '#0a0a0c', roughness: 0.7, metalness: 0.3 });
	const portRimMat = new MeshStandardMaterial({ color: '#c8ccd2', roughness: 0.35, metalness: 1 });
	const footMat = new MeshStandardMaterial({ color: '#1a1a1d', roughness: 0.95 });
	const switchMat = new MeshStandardMaterial({ color: '#d4d7dc', roughness: 0.4, metalness: 0.8 });
	const cableMat = new MeshStandardMaterial({ roughness: 0.6, metalness: 0.05 });
	const matMat = new MeshStandardMaterial({ roughness: 0.97, metalness: 0 }); // Stoff
	const stitchMat = new MeshStandardMaterial({ roughness: 0.9, metalness: 0 });

	const PLATE_COLORS = { aluminium: '#9aa0a8', brass: '#c9a227', polycarbonate: '#dfe6ee' };
	/** Seam/Badge in Messing, wenn die Platte Messing ist – sonst Stahl */
	const trimColor = $derived(build.plate.material === 'brass' ? '#c9a227' : '#b8bcc4');

	$effect(() => {
		keyBaseMat.color.set(build.keycapSet.colors.base);
		keyAccentMat.color.set(build.keycapSet.colors.accent);
		// Novelty-Esc: dritte Farbe des Sets (die Legendenfarbe) als Kappe
		keyNoveltyMat.color.set(build.keycapSet.colors.legend);
		cableMat.color.set(build.keycapSet.colors.accent);
		invalidate();
	});
	$effect(() => {
		caseMat.color.set(build.caseColor.hex);
		invalidate();
	});
	$effect(() => {
		metalMat.color.set(trimColor);
		const c = PLATE_COLORS[build.plate.material];
		plateMat.color.set(c);
		plateMat.roughness = build.plate.material === 'polycarbonate' ? 0.5 : 0.28;
		plateMat.metalness = build.plate.material === 'polycarbonate' ? 0.1 : 0.95;
		invalidate();
	});
	$effect(() => {
		underglowMat.emissive = new Color(build.keycapSet.colors.accent);
		invalidate();
	});
	$effect(() => {
		if (deskmat === 'match') {
			matMat.color.set(build.keycapSet.colors.base);
			stitchMat.color.set(build.keycapSet.colors.accent);
		} else {
			matMat.color.set('#26262c');
			stitchMat.color.set('#3d3d47');
		}
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

	/**
	 * Legenden-Kontrast pro Taste: helle Kappe → dunkle Schrift, dunkle Kappe →
	 * helle Schrift. Entscheidet über die relative Luminanz der Kappenfarbe,
	 * nicht pauschal pro Set – sonst verschwindet der Aufdruck auf Akzenttasten.
	 */
	function legendFor(bgHex: string, preferred: string): string {
		const bg = new Color(bgHex);
		const lum = 0.2126 * bg.r + 0.7152 * bg.g + 0.0722 * bg.b; // linear, wie Three sie hält
		if (lum > 0.3) return '#16161a';
		const pref = new Color(preferred);
		const prefLum = 0.2126 * pref.r + 0.7152 * pref.g + 0.0722 * pref.b;
		return prefLum > 0.35 ? preferred : '#f4f4f5';
	}

	const backlightColor = $derived(lightingMode === 'white' ? '#fff3d6' : '#ffffff');

	// Shine-Through: bei Beleuchtung leuchten die Legenden selbst.
	// Color-Werte > 1 landen im HalfFloat-Buffer und werden vom Bloom erfasst.
	// RGB: eine eigene Color pro Taste, die die Welle pro Frame mutiert – troika
	// kopiert Color-Objekte bei jedem Render, Svelte muss nichts neu rendern.
	const rgbLegendColors = $derived(new Map(layout.keys.map((k) => [k.id, new Color(1, 1, 1)])));
	const whiteGlow = $derived(new Color(backlightColor).multiplyScalar(2.4));
	const set = $derived(build.keycapSet.colors);
	const legendBase = $derived(legendFor(set.base, set.legend));
	const legendAccent = $derived(legendFor(set.accent, set.legend));
	const legendNovelty = $derived(legendFor(set.legend, set.base));

	function legendColor(key: KeyDef) {
		if (lightingMode === 'rgb') return rgbLegendColors.get(key.id)!;
		if (lightingMode === 'white') return whiteGlow;
		if (isNovelty(key)) return legendNovelty;
		return key.accent ? legendAccent : legendBase;
	}

	// Welle: Textur-Offset UND Legendenfarben pro Frame – gleiche Phase, gleiche Richtung
	const wave = useTask(
		(delta) => {
			rainbow.offset.x = (rainbow.offset.x + delta * 0.25) % 1;
			for (const key of layout.keys) {
				const u = (key.x + layout.width / 2) / layout.width;
				const hue = (u + rainbow.offset.x) % 1;
				rgbLegendColors.get(key.id)!.setHSL(hue, 1, 0.6).multiplyScalar(2.2);
			}
		},
		{ autoStart: false }
	);
	$effect(() => {
		if (lightingMode === 'rgb') wave.start();
		else wave.stop();
	});

	// Novelty-Esc: eigenes Material + gewählte Glyphe statt "Esc"
	const noveltyGlyph = $derived(build.novelty.glyph);
	const noveltyEsc = (key: KeyDef): KeyDef =>
		key.code === 'Escape' && noveltyGlyph ? { ...key, label: noveltyGlyph, symbol: true } : key;
	const isNovelty = (key: KeyDef) => key.code === 'Escape' && !!noveltyGlyph;

	// Gravur: dunkel auf hellem Case, hell auf dunklem
	const engravingColor = $derived(legendFor(build.caseColor.hex, '#ffffff'));

	// Naht der Deskmat: vier flache Streifen [x, z, breite, tiefe]
	const stitches = $derived([
		[0, matD / 2 - 0.12, matW - 0.2, 0.05],
		[0, -matD / 2 + 0.12, matW - 0.2, 0.05],
		[matW / 2 - 0.12, 0, 0.05, matD - 0.2],
		[-matW / 2 + 0.12, 0, 0.05, matD - 0.2]
	]);
</script>

<T.Group>
	<!-- Deskmat: Stoff-Fläche mit genähter Kante, Board sitzt im oberen Drittel -->
	{#if deskmat !== 'none'}
		<T.Group position={[caseX, GROUND_Y + 0.01, 0.9]}>
			<T.Mesh material={matMat} receiveShadow>
				<T.BoxGeometry args={[matW, 0.05, matD]} />
			</T.Mesh>
			{#each stitches as [x, z, w, d], i (i)}
				<T.Mesh material={stitchMat} position={[x, 0.026, z]}>
					<T.BoxGeometry args={[w, 0.004, d]} />
				</T.Mesh>
			{/each}
		</T.Group>
	{/if}

	<!-- Gehäuse: Extrusion mit Fase, Unterkante bei -CASE_H, Oberkante bei 0 -->
	<T.Mesh
		geometry={caseGeo}
		material={caseMat}
		position={[caseX, -CASE_H, 0]}
		rotation.x={-Math.PI / 2}
		receiveShadow
		castShadow
	/>
	<!-- Seam: Metallband im unteren Drittel, Messing bei Messingplatte -->
	<T.Mesh
		geometry={seamGeo}
		material={metalMat}
		position={[caseX, -CASE_H * 0.62, 0]}
		rotation.x={-Math.PI / 2}
	/>

	<!-- Badge hinten rechts: Messing/Stahl-Plakette mit Schriftzug -->
	<T.Group position={[caseX + caseW / 2 - 1.9, -CASE_H * 0.3, rearZ - 0.012]}>
		<T.Mesh material={metalMat}>
			<T.BoxGeometry args={[2.4, 0.3, 0.024]} />
		</T.Mesh>
		<Text
			text="SWITCHFORGE"
			font={fontUrl}
			fontSize={0.13}
			letterSpacing={0.25}
			color="#101013"
			anchorX="center"
			anchorY="middle"
			position={[0, 0, -0.013]}
			rotation.y={Math.PI}
		/>
	</T.Group>

	<!-- USB-C-Port hinten mittig: dunkle Buchse mit Metallrahmen -->
	<T.Group position={[caseX, -CASE_H * 0.45, rearZ]}>
		<T.Mesh material={portRimMat} position.z={-0.01}>
			<T.BoxGeometry args={[0.72, 0.3, 0.06]} />
		</T.Mesh>
		<T.Mesh material={portMat} position.z={-0.02}>
			<T.BoxGeometry args={[0.6, 0.2, 0.08]} />
		</T.Mesh>
	</T.Group>

	{#if wireless}
		<!-- Wireless: Schiebeschalter hinten links + Dongle-Slot neben dem USB-Port -->
		<T.Group position={[caseX - caseW / 2 + 1.6, -CASE_H * 0.45, rearZ]}>
			<T.Mesh material={portMat} position.z={-0.01}>
				<T.BoxGeometry args={[0.5, 0.18, 0.06]} />
			</T.Mesh>
			<T.Mesh material={switchMat} position={[0.12, 0, -0.05]}>
				<T.BoxGeometry args={[0.18, 0.12, 0.06]} />
			</T.Mesh>
		</T.Group>
		<T.Group position={[caseX + 1.1, -CASE_H * 0.45, rearZ]}>
			<T.Mesh material={portMat} position.z={-0.01}>
				<T.BoxGeometry args={[0.36, 0.14, 0.06]} />
			</T.Mesh>
		</T.Group>
	{:else}
		<!-- Spiralkabel in Akzentfarbe, mit Stecker am Port -->
		<T.Mesh material={portRimMat} position={[caseX, -CASE_H * 0.45, rearZ - 0.16]}>
			<T.BoxGeometry args={[0.5, 0.2, 0.28]} />
		</T.Mesh>
		<T.Mesh geometry={cableGeo} material={cableMat} castShadow />
	{/if}

	<!-- Gummifüsse an den vier Ecken -->
	{#each [-1, 1] as sx (sx)}
		{#each [-1, 1] as sz (sz)}
			<T.Mesh
				material={footMat}
				position={[caseX + sx * (caseW / 2 - 0.9), -CASE_H - 0.03, sz * (caseD / 2 - 0.6)]}
			>
				<T.CylinderGeometry args={[0.28, 0.28, 0.06, 16]} />
			</T.Mesh>
		{/each}
	{/each}

	{#if build.engraving}
		<!-- Gravur auf der vorderen Case-Kante, rechts -->
		<Text
			text={build.engraving}
			font={fontUrl}
			fontSize={0.2}
			letterSpacing={0.12}
			anchorX="right"
			anchorY="middle"
			color={engravingColor}
			fillOpacity={0.6}
			position={[caseX + caseW / 2 - 0.6, -CASE_H * 0.36, caseD / 2 + 0.002]}
		/>
	{/if}

	<!-- Platte, sichtbar in den Spalten zwischen den Tasten (trägt das Backlight) -->
	<T.Mesh material={plateMat} position.y={PLATE_H / 2} receiveShadow>
		<T.BoxGeometry args={[layout.width + 0.1, PLATE_H, layout.depth + 0.1]} />
	</T.Mesh>

	<!-- Backlight-Schein auf die Keycap-Unterseiten -->
	{#if lightingMode !== 'none'}
		<T.PointLight position={[0, 0.3, 0]} color={backlightColor} intensity={1.2} distance={5} />
	{/if}

	<!-- Tasten -->
	<T.Group position.y={PLATE_H}>
		{#each layout.keys as key (key.id)}
			<Keycap
				def={noveltyEsc(key)}
				geometry={keyGeometries.get(key.w)!}
				material={isNovelty(key) ? keyNoveltyMat : key.accent ? keyAccentMat : keyBaseMat}
				legendColor={legendColor(key)}
				height={KEY_H}
				gap={GAP}
			/>
		{/each}
	</T.Group>

	{#if underglow}
		<!-- Underglow: leuchtender Streifen unter dem Case + Licht auf den Boden -->
		<T.Mesh material={underglowMat} position={[caseX, -CASE_H - 0.01, 0]} rotation.x={-Math.PI / 2}>
			<T.PlaneGeometry args={[caseW + 0.16, caseD + 0.16]} />
		</T.Mesh>
		<T.PointLight
			position={[0, -CASE_H + 0.2, 0]}
			color={build.keycapSet.colors.accent}
			intensity={12}
			distance={8}
			decay={2}
		/>
	{/if}

	<!-- Boden: fängt Schatten und Underglow -->
	{#if ground}
		<T.Mesh position.y={GROUND_Y} rotation.x={-Math.PI / 2} receiveShadow>
			<T.PlaneGeometry args={[80, 80]} />
			<T.MeshStandardMaterial color="#0b0b0f" roughness={0.9} metalness={0.05} />
		</T.Mesh>
	{/if}
</T.Group>
