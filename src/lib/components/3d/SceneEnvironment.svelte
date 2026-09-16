<!--
	Environment-Map ohne Asset: Three's RoomEnvironment wird einmal per
	PMREM in eine Reflexions-Textur gerendert. Ohne so eine Map sehen
	metallische Materialien flach und schwarz aus – mit ihr bekommen
	Case und Platte echte Highlights. Kostet ~0 Bandbreite.
-->
<script lang="ts">
	import { useThrelte } from '@threlte/core';
	import { PMREMGenerator } from 'three';
	import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

	const { scene, renderer } = useThrelte();

	$effect(() => {
		const pmrem = new PMREMGenerator(renderer);
		const envMap = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
		scene.environment = envMap;
		// gedämpft, damit die Szene dunkel bleibt und nur die Kanten glänzen
		scene.environmentIntensity = 0.25;
		pmrem.dispose();

		return () => {
			scene.environment = null;
			envMap.dispose();
		};
	});
</script>
