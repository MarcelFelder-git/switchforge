/**
 * Physische Tastatur-Layouts.
 *
 * Jede Reihe ist ein String im Mini-Format:
 *   Token            = 1u-Taste, Label = Token
 *   Token:2.25       = Taste mit Breite in Units (1u = 19.05 mm)
 *   _0.5             = Lücke von 0.5u
 *   Label=Code       = anderes Label als KeyboardEvent.code (z. B. "⇧=ShiftLeft")
 *
 * Daraus entstehen Positionen fürs 3D-Modell UND das Mapping
 * KeyboardEvent.code → Taste, damit man auf der echten Tastatur tippen
 * und das 3D-Modell reagieren sehen kann.
 */

import type { LayoutSize } from './catalog';
// (nur Typ-Import → kein Laufzeit-Zyklus mit catalog.ts)

export interface KeyDef {
	/** Eindeutig pro Layout, z. B. "r2-KeyA" */
	id: string;
	label: string;
	/** KeyboardEvent.code, für physisches Tippen */
	code: string;
	/** Breite in Units */
	w: number;
	/** Mittelpunkt in Units, x nach rechts, z nach hinten (Reihe 0 = oben) */
	x: number;
	z: number;
	/** true bei Modifier/Funktionstasten → Akzentfarbe der Keycaps */
	accent: boolean;
}

export interface KeyboardLayout {
	size: LayoutSize;
	keys: KeyDef[];
	/** Gesamtbreite/-tiefe in Units */
	width: number;
	depth: number;
}

// Labels, die nicht 1:1 ein KeyboardEvent.code sind
const CODE_BY_LABEL: Record<string, string> = {
	'`': 'Backquote',
	'-': 'Minus',
	'=': 'Equal',
	'[': 'BracketLeft',
	']': 'BracketRight',
	'\\': 'Backslash',
	';': 'Semicolon',
	"'": 'Quote',
	',': 'Comma',
	'.': 'Period',
	'/': 'Slash',
	Esc: 'Escape',
	Bksp: 'Backspace',
	Caps: 'CapsLock',
	Win: 'MetaLeft',
	Fn: 'Fn',
	Menu: 'ContextMenu',
	Ins: 'Insert',
	Del: 'Delete',
	PgUp: 'PageUp',
	PgDn: 'PageDown',
	PrtSc: 'PrintScreen',
	ScrLk: 'ScrollLock',
	'↑': 'ArrowUp',
	'↓': 'ArrowDown',
	'←': 'ArrowLeft',
	'→': 'ArrowRight'
};

const ACCENT_CODES = new Set([
	'Escape',
	'Backspace',
	'Tab',
	'CapsLock',
	'Enter',
	'ShiftLeft',
	'ShiftRight',
	'ControlLeft',
	'ControlRight',
	'MetaLeft',
	'AltLeft',
	'AltRight',
	'Fn',
	'ContextMenu'
]);

function codeFor(label: string): string {
	if (CODE_BY_LABEL[label]) return CODE_BY_LABEL[label];
	if (/^[A-Z]$/.test(label)) return `Key${label}`;
	if (/^[0-9]$/.test(label)) return `Digit${label}`;
	return label; // F1, Home, End, Space, Enter, Tab, Pause ...
}

interface RowSpec {
	keys: string;
	/** Zusätzlicher Abstand VOR dieser Reihe (z. B. F-Reihe absetzen) */
	gapBefore?: number;
}

function buildLayout(size: LayoutSize, rows: RowSpec[]): KeyboardLayout {
	const keys: KeyDef[] = [];
	let z = 0;
	let width = 0;

	rows.forEach((row, rowIndex) => {
		z += row.gapBefore ?? 0;
		let x = 0;
		for (const token of row.keys.trim().split(/\s+/)) {
			if (token.startsWith('_')) {
				x += Number(token.slice(1));
				continue;
			}
			const [head, wRaw] = token.split(':');
			const w = wRaw ? Number(wRaw) : 1;
			const [label, codeOverride] = head.split('=');
			const code = codeOverride ?? codeFor(label);
			keys.push({
				id: `r${rowIndex}-${code}`,
				label,
				code,
				w,
				x: x + w / 2,
				z: z + 0.5,
				accent: ACCENT_CODES.has(code) || w >= 6
			});
			x += w;
		}
		width = Math.max(width, x);
		z += 1;
	});

	// Ursprung in die Mitte legen – erleichtert Kamera und Gehäuse
	const depth = z;
	for (const k of keys) {
		k.x -= width / 2;
		k.z -= depth / 2;
	}

	return { size, keys, width, depth };
}

// Gemeinsame Alphanumerik-Reihen (60 %-Kern)
const ROW_NUM = 'Esc 1 2 3 4 5 6 7 8 9 0 - = Bksp:2';
const ROW_NUM_TILDE = '` 1 2 3 4 5 6 7 8 9 0 - = Bksp:2';
const ROW_Q = 'Tab:1.5 Q W E R T Y U I O P [ ] \\:1.5';
const ROW_A = "Caps:1.75 A S D F G H J K L ; ' Enter:2.25";
const ROW_Z = '⇧=ShiftLeft:2.25 Z X C V B N M , . /';
// Bottom-Row für 65 %/75 %: 10u bis Space-Ende, 2×1.25u, 0.5u Lücke, Pfeile bei 13–16u
const ROW_BOTTOM_65 =
	'Ctrl=ControlLeft:1.25 Win:1.25 Alt=AltLeft:1.25 Space:6.25 Alt=AltRight:1.25 Fn:1.25 _0.5 ← ↓ →';

export const layouts: Record<LayoutSize, KeyboardLayout> = {
	'60%': buildLayout('60%', [
		{ keys: ROW_NUM },
		{ keys: ROW_Q },
		{ keys: ROW_A },
		{ keys: `${ROW_Z} ⇧=ShiftRight:2.75` },
		{
			keys: 'Ctrl=ControlLeft:1.25 Win:1.25 Alt=AltLeft:1.25 Space:6.25 Alt=AltRight:1.25 Fn:1.25 Menu:1.25 Ctrl=ControlRight:1.25'
		}
	]),

	'65%': buildLayout('65%', [
		{ keys: `${ROW_NUM} Del` },
		{ keys: `${ROW_Q} PgUp` },
		{ keys: `${ROW_A} PgDn` },
		{ keys: `${ROW_Z} ⇧=ShiftRight:1.75 ↑ End` },
		// 1.25er Alt/Fn + 0.5u Lücke → ↓ sitzt exakt unter ↑ (invertiertes T wie beim TKL)
		{ keys: `${ROW_BOTTOM_65}` }
	]),

	'75%': buildLayout('75%', [
		{ keys: 'Esc F1 F2 F3 F4 F5 F6 F7 F8 F9 F10 F11 F12 PrtSc Pause Del' },
		{ keys: `${ROW_NUM_TILDE} Home`, gapBefore: 0.25 },
		{ keys: `${ROW_Q} PgUp` },
		{ keys: `${ROW_A} PgDn` },
		{ keys: `${ROW_Z} ⇧=ShiftRight:1.75 ↑ End` },
		{ keys: `${ROW_BOTTOM_65}` }
	]),

	TKL: buildLayout('TKL', [
		{
			keys: 'Esc _1 F1 F2 F3 F4 _0.5 F5 F6 F7 F8 _0.5 F9 F10 F11 F12 _0.25 PrtSc ScrLk Pause'
		},
		{ keys: `${ROW_NUM_TILDE} _0.25 Ins Home PgUp`, gapBefore: 0.5 },
		{ keys: `${ROW_Q} _0.25 Del End PgDn` },
		{ keys: ROW_A },
		{ keys: `${ROW_Z} ⇧=ShiftRight:2.75 _1.25 ↑` },
		{
			keys: 'Ctrl=ControlLeft:1.25 Win:1.25 Alt=AltLeft:1.25 Space:6.25 Alt=AltRight:1.25 Win=MetaRight:1.25 Menu:1.25 Ctrl=ControlRight:1.25 _0.25 ← ↓ →'
		}
	])
};

export function keyCount(size: LayoutSize): number {
	return layouts[size].keys.length;
}
