/**
 * Prozedurale Switch-Sounds – physikalisch motiviert statt "Rauschen mit Hüllkurve".
 *
 * Wie ein echter Anschlag entsteht:
 *   1. Der Stem trifft das Gehäuse → kurzer Impuls (Klack)
 *   2. Der Impuls regt das Gehäuse an → es schwingt in seinen Eigenfrequenzen
 *      (Resonanzmoden) aus. DAS ist der Klangcharakter: "thock" = tiefe Moden,
 *      "clack" = hohe Moden.
 *   3. Beim Bottom-out federt die Platte kurz → tiefer Thud mit fallender Tonhöhe
 *
 * Hier: Impuls = Rauschburst mit exponentiellem Decay, Moden = Biquad-Bandpässe
 * mit hohem Q, Thud = Sinus mit Pitch-Sweep. Gerendert in einem OfflineAudioContext
 * einmal pro Profil, danach liegt es als Buffer vor wie ein echtes Sample.
 *
 * Fallback für fehlende /static/audio/*.mp3 – und die Null-Kosten-Variante:
 * kein Asset, keine Lizenz, kein Netzwerk.
 */
import type { SwitchType, PlateOption } from '$lib/data/catalog';

export type PlateMaterial = PlateOption['material'];

/**
 * Die Platte färbt den Klang: Messing ist steif und schwer → höhere, längere
 * Resonanzen ("ping"); Polycarbonat ist weich → tiefer, gedämpfter.
 * Multiplikatoren auf Moden-Frequenz, Güte und Tiefpass.
 */
const PLATE_VOICING: Record<PlateMaterial, { f: number; q: number; lp: number }> = {
	aluminium: { f: 1, q: 1, lp: 1 },
	brass: { f: 1.18, q: 1.4, lp: 1.35 },
	polycarbonate: { f: 0.84, q: 0.65, lp: 0.7 }
};

interface Mode {
	/** Eigenfrequenz in Hz */
	f: number;
	/** Güte – höher = längeres, tonaleres Ausklingen */
	q: number;
	/** Anteil im Mix */
	g: number;
}

interface Impulse {
	/** Startzeit in s (zweiter Impuls = Bump oder Release-Click) */
	at: number;
	/** Länge des Rauschbursts in s */
	len: number;
	/** Lautstärke */
	g: number;
}

interface Profile {
	duration: number;
	impulses: Impulse[];
	modes: Mode[];
	/** Direkter Klack-Anteil (Impuls ohne Resonator), per Highpass geschärft */
	click: { hp: number; g: number };
	/** Bottom-out-Thud */
	thud: { f: number; sweep: number; decay: number; g: number };
	/** Globaler Tiefpass – nimmt die Schärfe raus */
	lowpass: number;
}

const PROFILES: Record<SwitchType, Profile> = {
	// Tief, rund, gedämpft – "thock"
	linear: {
		duration: 0.18,
		impulses: [{ at: 0, len: 0.004, g: 1 }],
		modes: [
			{ f: 175, q: 9, g: 1 },
			{ f: 340, q: 10, g: 0.55 },
			{ f: 720, q: 7, g: 0.3 },
			{ f: 1600, q: 5, g: 0.12 }
		],
		click: { hp: 2500, g: 0.12 },
		thud: { f: 95, sweep: 1.6, decay: 0.045, g: 0.8 },
		lowpass: 3200
	},
	// Mittig, mit spürbarem zweiten Transienten (der Bump)
	tactile: {
		duration: 0.18,
		impulses: [
			{ at: 0, len: 0.003, g: 0.9 },
			{ at: 0.016, len: 0.002, g: 0.5 }
		],
		modes: [
			{ f: 240, q: 8, g: 0.8 },
			{ f: 560, q: 9, g: 0.6 },
			{ f: 1300, q: 6, g: 0.45 },
			{ f: 2800, q: 5, g: 0.22 }
		],
		click: { hp: 2200, g: 0.3 },
		thud: { f: 130, sweep: 1.5, decay: 0.035, g: 0.55 },
		lowpass: 5500
	},
	// Hell, metallisch, mit Click-Jacket beim Loslassen
	clicky: {
		duration: 0.2,
		impulses: [
			{ at: 0, len: 0.0015, g: 1 },
			{ at: 0.05, len: 0.0012, g: 0.65 }
		],
		modes: [
			{ f: 300, q: 6, g: 0.35 },
			{ f: 1100, q: 7, g: 0.35 },
			{ f: 3400, q: 14, g: 0.9 },
			{ f: 5200, q: 16, g: 0.7 }
		],
		click: { hp: 3000, g: 0.9 },
		thud: { f: 160, sweep: 1.3, decay: 0.025, g: 0.3 },
		lowpass: 12000
	}
};

function noiseBurst(ctx: BaseAudioContext, len: number): AudioBuffer {
	const n = Math.max(1, Math.ceil(len * ctx.sampleRate));
	const buf = ctx.createBuffer(1, n, ctx.sampleRate);
	const d = buf.getChannelData(0);
	for (let i = 0; i < n; i++) {
		// exponentieller Decay innerhalb des Bursts → weicher Rand, kein Klick-Artefakt
		d[i] = (Math.random() * 2 - 1) * Math.exp((-4 * i) / n);
	}
	return buf;
}

export async function synthesize(
	profile: SwitchType,
	ctx: BaseAudioContext,
	plate: PlateMaterial = 'aluminium'
): Promise<AudioBuffer> {
	const p = PROFILES[profile];
	const voice = PLATE_VOICING[plate];
	const sr = ctx.sampleRate;
	const off = new OfflineAudioContext(1, Math.ceil(p.duration * sr), sr);

	const master = off.createGain();
	master.gain.value = 1;
	const lp = off.createBiquadFilter();
	lp.type = 'lowpass';
	lp.frequency.value = Math.min(p.lowpass * voice.lp, sr / 2 - 100);
	master.connect(lp).connect(off.destination);

	// Resonatoren einmal aufbauen, alle Impulse speisen sie parallel
	const resonatorIn = off.createGain();
	for (const m of p.modes) {
		const bp = off.createBiquadFilter();
		bp.type = 'bandpass';
		bp.frequency.value = m.f * voice.f;
		bp.Q.value = m.q * voice.q;
		const g = off.createGain();
		g.gain.value = m.g;
		resonatorIn.connect(bp).connect(g).connect(master);
	}

	// Direkter Klack: Impuls → Highpass
	const clickHp = off.createBiquadFilter();
	clickHp.type = 'highpass';
	clickHp.frequency.value = p.click.hp;
	const clickGain = off.createGain();
	clickGain.gain.value = p.click.g;
	clickHp.connect(clickGain).connect(master);

	for (const imp of p.impulses) {
		const src = off.createBufferSource();
		src.buffer = noiseBurst(off, imp.len);
		const g = off.createGain();
		g.gain.value = imp.g;
		src.connect(g);
		g.connect(resonatorIn);
		g.connect(clickHp);
		src.start(imp.at);
	}

	// Bottom-out-Thud: Sinus, Tonhöhe fällt in 12 ms auf Grundton, schneller Decay
	const osc = off.createOscillator();
	osc.type = 'sine';
	osc.frequency.setValueAtTime(p.thud.f * p.thud.sweep, 0);
	osc.frequency.exponentialRampToValueAtTime(p.thud.f, 0.012);
	const thudGain = off.createGain();
	thudGain.gain.setValueAtTime(p.thud.g, 0);
	thudGain.gain.exponentialRampToValueAtTime(0.001, p.thud.decay);
	osc.connect(thudGain).connect(master);
	osc.start(0);
	osc.stop(p.thud.decay + 0.01);

	const rendered = await off.startRendering();

	// Normalisieren, damit alle Profile gleich laut sind
	const data = rendered.getChannelData(0);
	let peak = 0;
	for (let i = 0; i < data.length; i++) peak = Math.max(peak, Math.abs(data[i]));
	if (peak > 0) {
		const k = 0.9 / peak;
		for (let i = 0; i < data.length; i++) data[i] *= k;
	}

	// In den Ziel-Context kopieren (Offline-Buffer sind kompatibel, aber sauberer so)
	const out = ctx.createBuffer(1, rendered.length, sr);
	out.copyToChannel(data, 0);
	return out;
}
