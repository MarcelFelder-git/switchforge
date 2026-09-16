/**
 * WebAudio-Engine für Switch-Sound-Profile.
 *
 * Warum WebAudio statt <audio>?
 * - Samples werden einmal dekodiert und liegen dann als AudioBuffer im RAM.
 * - Jeder Tastendruck erzeugt eine neue BufferSource → beliebig viele
 *   überlappende Anschläge ohne Cut-off (wichtig beim schnellen Tippen).
 * - Latenz im einstelligen Millisekundenbereich.
 *
 * Quelle der Samples, in dieser Reihenfolge:
 * 1. /static/audio/<profile>.mp3 – falls vorhanden (echte Aufnahmen)
 * 2. Prozedurale Synthese (synth.ts) – ohne Assets, ohne Netzwerk
 *
 * Browser blockieren AudioContext bis zur ersten User-Interaktion;
 * `unlock()` muss deshalb aus einem Click-/Keydown-Handler aufgerufen werden.
 */
import type { SwitchType } from '$lib/data/catalog';
import { synthesize, type PlateMaterial } from './synth';

const SAMPLE_PATHS: Record<SwitchType, string> = {
	linear: '/audio/linear.mp3',
	tactile: '/audio/tactile.mp3',
	clicky: '/audio/clicky.mp3'
};

class SoundEngine {
	private ctx: AudioContext | null = null;
	// Cache-Key: Profil + Platte (die Platte verändert den synthetischen Klang)
	private buffers = new Map<string, AudioBuffer>();
	private loading = new Map<string, Promise<AudioBuffer>>();
	private master: GainNode | null = null;
	private _volume = 0.8;

	get volume() {
		return this._volume;
	}

	/** Muss aus einer User-Geste heraus aufgerufen werden (Autoplay-Policy) */
	async unlock(): Promise<void> {
		if (typeof window === 'undefined') return;
		if (!this.ctx) {
			this.ctx = new AudioContext({ latencyHint: 'interactive' });
			this.master = this.ctx.createGain();
			this.master.gain.value = this._volume;
			this.master.connect(this.ctx.destination);
		}
		if (this.ctx.state === 'suspended') {
			await this.ctx.resume();
		}
	}

	/** Sample vorladen – idealerweise, sobald Switch oder Platte gewählt werden */
	async preload(profile: SwitchType, plate: PlateMaterial = 'aluminium'): Promise<AudioBuffer> {
		const key = `${profile}:${plate}`;
		const cached = this.buffers.get(key);
		if (cached) return cached;

		const pending = this.loading.get(key);
		if (pending) return pending;

		if (!this.ctx) await this.unlock();
		const ctx = this.ctx!;

		const task = fetch(SAMPLE_PATHS[profile], { headers: { Accept: 'audio/*' } })
			.then((res) => {
				const type = res.headers.get('content-type') ?? '';
				// Vite/SvelteKit antworten auf fehlende Dateien mit HTML statt 404
				if (!res.ok || !type.startsWith('audio/')) throw new Error('no sample');
				return res.arrayBuffer();
			})
			.then((data) => ctx.decodeAudioData(data))
			.catch(() => synthesize(profile, ctx, plate))
			.then((buffer) => {
				this.buffers.set(key, buffer);
				this.loading.delete(key);
				return buffer;
			});

		this.loading.set(key, task);
		return task;
	}

	/**
	 * Sample abspielen. Leichte zufällige Pitch-Variation, damit sich
	 * schnelles Tippen nicht wie ein Loop anhört.
	 */
	async play(profile: SwitchType, plate: PlateMaterial = 'aluminium', velocity = 1): Promise<void> {
		await this.unlock();
		const buffer = await this.preload(profile, plate);
		if (!this.ctx || !this.master) return;

		const source = this.ctx.createBufferSource();
		source.buffer = buffer;
		source.playbackRate.value = 0.94 + Math.random() * 0.12;

		const gain = this.ctx.createGain();
		gain.gain.value = Math.min(Math.max(velocity, 0.2), 1);

		source.connect(gain).connect(this.master);
		source.start();
	}

	setVolume(value: number) {
		this._volume = Math.min(Math.max(value, 0), 1);
		if (this.master) this.master.gain.value = this._volume;
	}
}

export const soundEngine = new SoundEngine();
