<!--
	Physische Tastatur → 3D-Modell.
	Hört auf keydown/keyup am Window, mappt KeyboardEvent.code auf die
	Taste im aktuellen Layout und drückt sie im keypress-Store.
	Rendert nichts – ist nur wegen der Nähe zur Szene hier einsortiert.
-->
<script lang="ts">
	import { builder } from '$lib/stores/builderState.svelte';
	import { keypress } from '$lib/stores/keypress.svelte';
	import { layouts } from '$lib/data/layouts';

	// code → id für das aktuelle Layout
	const byCode = $derived(new Map(layouts[builder.baseKit.layout].keys.map((k) => [k.code, k.id])));

	function isTyping(target: EventTarget | null) {
		const el = target as HTMLElement | null;
		return !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);
	}

	function onKeydown(e: KeyboardEvent) {
		if (isTyping(e.target) || e.metaKey || e.ctrlKey) return;
		const id = byCode.get(e.code);
		if (!id) return;
		// Leertaste würde sonst die Seite scrollen
		if (e.code === 'Space') e.preventDefault();
		keypress.press(id);
	}

	function onKeyup(e: KeyboardEvent) {
		const id = byCode.get(e.code);
		if (id) keypress.release(id);
	}
</script>

<svelte:window onkeydown={onKeydown} onkeyup={onKeyup} onblur={() => keypress.releaseAll()} />
