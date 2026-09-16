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

export type KeyboardLanguage = 'de' | 'en';

export interface KeyDef {
	/** Eindeutig pro Layout, z. B. "r2-KeyA" */
	id: string;
	/** Aufdruck – Buchstabe, Wort oder Symbol (⌫, ⇧ …) */
	label: string;
	/** true → Label kommt aus der Symbol-Schrift (DejaVu-Subset), sonst JetBrains Mono */
	symbol: boolean;
	/** Zweitbelegung oben auf der Kappe (Shift), z. B. "!" über "1" */
	shiftLabel?: string;
	/** Kleines Symbol neben dem Wort, z. B. ↑ bei "Bild" */
	subLabel?: string;
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

/**
 * Aufdrucke pro Code, so wie sie auf echten Tastaturen stehen.
 *   en / de      Hauptlegende (Symbol oder Wort)
 *   shiftEn/De   Zweitbelegung, steht oben auf der Kappe (! " § …)
 *   subDe        kleines Symbol neben dem Wort (Bild↑ / Bild↓)
 * Fehlt `de`, gilt `en` für beide Sprachen.
 */
interface LabelSpec {
	en: string;
	de?: string;
	shiftEn?: string;
	shiftDe?: string;
	subDe?: string;
}

const LABELS: Record<string, LabelSpec> = {
	// Symbole (sprachunabhängig)
	Backspace: { en: '⌫' },
	Enter: { en: '⏎' },
	Tab: { en: '⇥' },
	CapsLock: { en: '⇪' },
	ShiftLeft: { en: '⇧' },
	ShiftRight: { en: '⇧' },
	MetaLeft: { en: '⊞' },
	MetaRight: { en: '⊞' },
	ContextMenu: { en: '☰' },
	ArrowUp: { en: '↑' },
	ArrowDown: { en: '↓' },
	ArrowLeft: { en: '←' },
	ArrowRight: { en: '→' },
	// Wörter – deutsch beschriftet wie auf einer DE-Tastatur
	ControlLeft: { en: 'Ctrl', de: 'Strg' },
	ControlRight: { en: 'Ctrl', de: 'Strg' },
	AltRight: { en: 'Alt', de: 'AltGr' },
	Delete: { en: 'Del', de: 'Entf' },
	Insert: { en: 'Ins', de: 'Einfg' },
	Home: { en: 'Home', de: 'Pos1' },
	End: { en: 'End', de: 'Ende' },
	PageUp: { en: 'PgUp', de: 'Bild', subDe: '↑' },
	PageDown: { en: 'PgDn', de: 'Bild', subDe: '↓' },
	PrintScreen: { en: 'PrtSc', de: 'Druck' },
	ScrollLock: { en: 'ScrLk', de: 'Rollen' },
	// Zahlenreihe mit Shift-Belegung
	Digit1: { en: '1', shiftEn: '!', shiftDe: '!' },
	Digit2: { en: '2', shiftEn: '@', shiftDe: '"' },
	Digit3: { en: '3', shiftEn: '#', shiftDe: '§' },
	Digit4: { en: '4', shiftEn: '$', shiftDe: '$' },
	Digit5: { en: '5', shiftEn: '%', shiftDe: '%' },
	Digit6: { en: '6', shiftEn: '^', shiftDe: '&' },
	Digit7: { en: '7', shiftEn: '&', shiftDe: '/' },
	Digit8: { en: '8', shiftEn: '*', shiftDe: '(' },
	Digit9: { en: '9', shiftEn: '(', shiftDe: ')' },
	Digit0: { en: '0', shiftEn: ')', shiftDe: '=' },
	// Satzzeichen – hier unterscheiden sich QWERTY und QWERTZ am meisten
	Backquote: { en: '`', de: '^', shiftEn: '~', shiftDe: '°' },
	Minus: { en: '-', de: 'ß', shiftEn: '_', shiftDe: '?' },
	Equal: { en: '=', de: '´', shiftEn: '+', shiftDe: '`' },
	BracketLeft: { en: '[', de: 'Ü', shiftEn: '{' },
	BracketRight: { en: ']', de: '+', shiftEn: '}', shiftDe: '*' },
	Backslash: { en: '\\', de: '#', shiftEn: '|', shiftDe: "'" },
	Semicolon: { en: ';', de: 'Ö', shiftEn: ':' },
	Quote: { en: "'", de: 'Ä', shiftEn: '"' },
	Comma: { en: ',', shiftEn: '<', shiftDe: ';' },
	Period: { en: '.', shiftEn: '>', shiftDe: ':' },
	Slash: { en: '/', de: '-', shiftEn: '?', shiftDe: '_' },
	KeyY: { en: 'Y', de: 'Z' },
	KeyZ: { en: 'Z', de: 'Y' }
};

/** Zeichen, die aus der Symbol-Schrift kommen müssen (nicht in JetBrains Mono Latin) */
const SYMBOL_CHARS = new Set('⌫⏎⇥⇪⇧⊞☰↑↓←→'.split(''));
const isSymbol = (text: string) => [...text].some((ch) => SYMBOL_CHARS.has(ch));

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

function buildLayout(size: LayoutSize, rows: RowSpec[], lang: KeyboardLanguage): KeyboardLayout {
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
			const [name, codeOverride] = head.split('=');
			const code = codeOverride ?? codeFor(name);
			const spec = LABELS[code];
			const label = spec ? (lang === 'de' ? (spec.de ?? spec.en) : spec.en) : name;
			// DE: eigene Shift-Belegung; hat die Taste ein eigenes DE-Label (Ü, Ö …), ohne
			// shiftDe bleibt sie leer – sonst würde "{" über dem Ü landen.
			const shiftLabel = !spec
				? undefined
				: lang === 'en'
					? spec.shiftEn
					: spec.de !== undefined
						? spec.shiftDe
						: (spec.shiftDe ?? spec.shiftEn);
			const subLabel = spec && lang === 'de' ? spec.subDe : undefined;
			keys.push({
				id: `r${rowIndex}-${code}`,
				label,
				symbol: isSymbol(label),
				shiftLabel,
				subLabel,
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

const ROWS: Record<LayoutSize, RowSpec[]> = {
	'60%': [
		{ keys: ROW_NUM },
		{ keys: ROW_Q },
		{ keys: ROW_A },
		{ keys: `${ROW_Z} ⇧=ShiftRight:2.75` },
		{
			keys: 'Ctrl=ControlLeft:1.25 Win:1.25 Alt=AltLeft:1.25 Space:6.25 Alt=AltRight:1.25 Fn:1.25 Menu:1.25 Ctrl=ControlRight:1.25'
		}
	],

	'65%': [
		{ keys: `${ROW_NUM} Del` },
		{ keys: `${ROW_Q} PgUp` },
		{ keys: `${ROW_A} PgDn` },
		{ keys: `${ROW_Z} ⇧=ShiftRight:1.75 ↑ End` },
		// 1.25er Alt/Fn + 0.5u Lücke → ↓ sitzt exakt unter ↑ (invertiertes T wie beim TKL)
		{ keys: `${ROW_BOTTOM_65}` }
	],

	'75%': [
		{ keys: 'Esc F1 F2 F3 F4 F5 F6 F7 F8 F9 F10 F11 F12 PrtSc Pause Del' },
		{ keys: `${ROW_NUM_TILDE} Home`, gapBefore: 0.25 },
		{ keys: `${ROW_Q} PgUp` },
		{ keys: `${ROW_A} PgDn` },
		{ keys: `${ROW_Z} ⇧=ShiftRight:1.75 ↑ End` },
		{ keys: `${ROW_BOTTOM_65}` }
	],

	TKL: [
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
	]
};

const cache = new Map<string, KeyboardLayout>();

/** Layout für Grösse + Sprache, einmal gebaut und gecacht */
export function getLayout(size: LayoutSize, lang: KeyboardLanguage = 'en'): KeyboardLayout {
	const key = `${size}:${lang}`;
	let layout = cache.get(key);
	if (!layout) {
		layout = buildLayout(size, ROWS[size], lang);
		cache.set(key, layout);
	}
	return layout;
}

export function keyCount(size: LayoutSize): number {
	return getLayout(size).keys.length;
}
