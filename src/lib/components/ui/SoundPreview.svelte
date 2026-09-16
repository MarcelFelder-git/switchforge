<!--
	Sound-Kontrolle: Probe-Anschlag, Lautstärke, Mute.
	Der eigentliche Trigger sitzt im keypress-Store – hier ist nur die UI.
	Hinweis zum Tippen auf der echten Tastatur, weil das keiner von selbst entdeckt.
-->
<script lang="ts">
	import { builder } from '$lib/stores/builderState.svelte';
	import { keypress } from '$lib/stores/keypress.svelte';
	import { soundEngine } from '$lib/audio/soundEngine';
	import { getLayout } from '$lib/data/layouts';
	import { Button } from '$lib/components/ui/button';
	import { Slider } from '$lib/components/ui/slider';
	import Volume2 from '@lucide/svelte/icons/volume-2';
	import VolumeX from '@lucide/svelte/icons/volume-x';

	let volume = $state(soundEngine.volume * 100);

	$effect(() => {
		soundEngine.setVolume(volume / 100);
	});

	// Sample vorladen, sobald sich Switch-Typ oder Platte ändern
	$effect(() => {
		soundEngine.preload(builder.switch.soundProfile, builder.plate.material).catch(() => {});
	});

	// Probe-Anschlag: tippt "F" und "J" nacheinander im 3D-Modell
	function sample() {
		const keys = getLayout(builder.baseKit.layout, builder.language.id).keys;
		const f = keys.find((k) => k.code === 'KeyF');
		const j = keys.find((k) => k.code === 'KeyJ');
		if (f) keypress.tap(f.id);
		if (j) setTimeout(() => keypress.tap(j.id), 110);
	}
</script>

<section class="flex flex-col gap-3 border-t border-line/70 pt-5">
	<header class="flex items-baseline justify-between gap-3">
		<h3 class="font-mono text-[11px] tracking-[0.2em] text-ink-faint uppercase">
			<span class="text-ember">09</span> / Sound
		</h3>
		<span class="font-mono text-[11px] text-ink-muted">
			{keypress.strokes > 0 ? `${keypress.strokes} Anschläge` : 'Tipp auf deiner Tastatur'}
		</span>
	</header>

	<div class="flex items-center gap-2">
		<Button
			variant="outline"
			class="flex-1 justify-between hover:border-ember hover:text-ember"
			onclick={sample}
		>
			<span class="text-sm">▶ Probe-Anschlag</span>
			<span class="font-mono text-[10px] text-ink-faint">{builder.switch.name}</span>
		</Button>
		<Button
			variant="outline"
			size="icon"
			aria-label={keypress.muted ? 'Ton an' : 'Ton aus'}
			aria-pressed={keypress.muted}
			onclick={() => (keypress.muted = !keypress.muted)}
		>
			{#if keypress.muted}
				<VolumeX class="text-ink-faint" />
			{:else}
				<Volume2 />
			{/if}
		</Button>
	</div>

	<div class="flex items-center gap-3">
		<Slider type="single" bind:value={volume} min={0} max={100} step={1} class="flex-1" />
		<span class="w-8 text-right font-mono text-[10px] text-ink-faint">{Math.round(volume)}</span>
	</div>

	<p class="font-mono text-[10px] leading-relaxed text-ink-faint">
		Das 3D-Modell tippt mit, wenn du auf deiner eigenen Tastatur schreibst.
	</p>
</section>
