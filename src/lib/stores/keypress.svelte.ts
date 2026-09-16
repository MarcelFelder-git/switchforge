/**
 * Interaktions-State: welche Tasten sind gerade gedrückt?
 *
 * Bewusst getrennt von builderState: Die Konfiguration (was kaufe ich)
 * ändert sich selten und wird serialisiert; der Tastendruck ändert sich
 * zig-mal pro Sekunde und ist rein visuell/akustisch. So löst ein
 * Tastendruck keine Neuberechnung des Preises aus.
 */
import { SvelteSet } from 'svelte/reactivity';
import { builder } from './builderState.svelte';
import { soundEngine } from '$lib/audio/soundEngine';

/** Wie lange ein Klick im 3D-Modell die Taste "unten" hält */
const TAP_HOLD_MS = 90;

class KeypressState {
	/** IDs (KeyDef.id) der aktuell gedrückten Tasten */
	pressed = new SvelteSet<string>();

	/** Anzahl Anschläge in dieser Session – für kleine UI-Spielereien */
	strokes = $state(0);

	muted = $state(false);

	private tapTimers = new Map<string, ReturnType<typeof setTimeout>>();

	/** Taste runter (physische Tastatur oder Maus) */
	press(id: string) {
		if (this.pressed.has(id)) return; // Key-Repeat ignorieren
		this.pressed.add(id);
		this.strokes += 1;
		if (!this.muted) {
			soundEngine.play(builder.switch.soundProfile, builder.plate.material).catch(() => {});
		}
	}

	release(id: string) {
		this.pressed.delete(id);
	}

	/** Kurzer Anschlag, z. B. Klick auf eine 3D-Taste: runter, kurz halten, hoch */
	tap(id: string) {
		const existing = this.tapTimers.get(id);
		if (existing) {
			clearTimeout(existing);
			this.pressed.delete(id);
		}
		this.press(id);
		this.tapTimers.set(
			id,
			setTimeout(() => {
				this.release(id);
				this.tapTimers.delete(id);
			}, TAP_HOLD_MS)
		);
	}

	releaseAll() {
		this.pressed.clear();
	}
}

export const keypress = new KeypressState();
