<!--
	Threlte-Canvas: Licht, Environment, Kamera, Tastatur-Input.
	Das eigentliche Keyboard-Mesh lebt in KeyboardModel.svelte, damit die
	Szene-Infrastruktur unabhängig vom Modell bleibt.

	Performance-Entscheidungen:
	- dpr auf 1.5 gedeckelt: Retina-Displays rendern sonst 4x so viele Pixel
	  für einen Unterschied, den man bei dunklen Szenen kaum sieht.
	- Neutral-Tone-Mapping statt ACES: für Produktvisualisierung gemacht,
	  hält Cyan/Lime satt (ACES entsättigt helle Farben). Läuft im
	  PostProcessing-Pass zusammen mit Bloom.
-->
<script lang="ts">
	import { Canvas, T } from '@threlte/core';
	import { NeutralToneMapping } from 'three';
	import KeyboardModel from './KeyboardModel.svelte';
	import SceneEnvironment from './SceneEnvironment.svelte';
	import SceneCamera from './SceneCamera.svelte';
	import KeyboardInput from './KeyboardInput.svelte';
	import PostProcessing from './PostProcessing.svelte';
	import { builder, type BuilderState } from '$lib/stores/builderState.svelte';

	let {
		build = builder,
		autoRotate = false,
		shiftX = 0,
		shiftY = 0
	}: { build?: BuilderState; autoRotate?: boolean; shiftX?: number; shiftY?: number } = $props();
</script>

<div class="h-full w-full scanlines">
	<Canvas dpr={[1, 1.5]} toneMapping={NeutralToneMapping}>
		<SceneEnvironment />
		<SceneCamera {build} {autoRotate} {shiftX} {shiftY} />
		<KeyboardInput {build} />
		<PostProcessing />

		<T.AmbientLight intensity={0.08} />
		<!-- Key-Light von schräg oben; Schattenkamera eng am Keyboard für scharfe Schatten -->
		<T.DirectionalLight
			position={[6, 12, 6]}
			intensity={1.8}
			castShadow
			shadow.mapSize.width={2048}
			shadow.mapSize.height={2048}
			shadow.camera.left={-14}
			shadow.camera.right={14}
			shadow.camera.top={14}
			shadow.camera.bottom={-14}
			shadow.bias={-0.0004}
		/>
		<!-- Kaltes Rim-Light von hinten links: Cyberpunk-Kante auf dem Metall -->
		<T.SpotLight
			position={[-10, 6, -8]}
			intensity={40}
			color="#22d3ee"
			angle={0.6}
			penumbra={0.8}
		/>
		<!-- Warmes Fill von rechts, sehr schwach -->
		<T.PointLight position={[10, 4, 4]} intensity={6} color="#f97316" />

		<KeyboardModel {build} />
	</Canvas>
</div>
