<!--
	Bloom + Tone-Mapping über die `postprocessing`-Library.

	Warum: Emissive Flächen (Backlight, Underglow, leuchtende Legenden) sehen
	ohne Bloom aus wie flache helle Farbe. Bloom lässt alles über einem
	Helligkeits-Schwellwert weich ausstrahlen – das ist der "shiny"-Look.

	Threltes Auto-Render wird abgeschaltet und durch den Composer ersetzt.
	Tone-Mapping muss hier als Effekt passieren, weil Three es nur beim
	Rendern direkt auf den Bildschirm anwendet, nicht in Offscreen-Buffer.
-->
<script lang="ts">
	import { useThrelte, useTask } from '@threlte/core';
	import { HalfFloatType } from 'three';
	import {
		EffectComposer,
		EffectPass,
		RenderPass,
		BloomEffect,
		ToneMappingEffect,
		ToneMappingMode
	} from 'postprocessing';

	const { scene, renderer, camera, size, autoRender, renderStage } = useThrelte();

	// HalfFloat: Emissive-Werte > 1.0 überleben bis zum Bloom (sonst geclampt)
	const composer = new EffectComposer(renderer, { frameBufferType: HalfFloatType, alpha: true });

	const bloom = new BloomEffect({
		// Schwelle bei 1.0: nur HDR-Werte > 1 (Emissive, Legenden) glühen –
		// helle Keycaps im Licht bleiben unter 1 und damit scharf.
		luminanceThreshold: 1.0,
		luminanceSmoothing: 0.15,
		intensity: 1.0,
		mipmapBlur: true,
		radius: 0.6
	});
	const toneMapping = new ToneMappingEffect({ mode: ToneMappingMode.NEUTRAL });

	$effect(() => {
		composer.removeAllPasses();
		composer.addPass(new RenderPass(scene, $camera));
		composer.addPass(new EffectPass($camera, bloom, toneMapping));
	});

	$effect(() => {
		composer.setSize($size.width, $size.height);
	});

	$effect(() => {
		const before = autoRender.current;
		autoRender.set(false);
		return () => {
			autoRender.set(before);
			composer.dispose();
		};
	});

	useTask((delta) => composer.render(delta), { stage: renderStage, autoInvalidate: false });
</script>
