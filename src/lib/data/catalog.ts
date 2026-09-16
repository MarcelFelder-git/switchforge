/**
 * Produktkatalog – die einzige Quelle für Preise und Varianten.
 *
 * Alle Preise sind Integer in Cent (Minor Units). Das vermeidet
 * Float-Rundungsfehler und ist genau das Format, das Stripe erwartet.
 * Später kann dieser Katalog aus einer DB geladen werden – die Typen bleiben gleich.
 */

import { keyCount } from './layouts';

export const CURRENCY = 'EUR' as const;

export type SwitchType = 'linear' | 'tactile' | 'clicky';

export type LayoutSize = '60%' | '65%' | '75%' | 'TKL';

export interface BaseKit {
	id: string;
	name: string;
	layout: LayoutSize;
	/** Anzahl Tasten – aus dem physischen Layout abgeleitet, bestimmt Switch-Menge */
	keyCount: number;
	priceCents: number;
	description: string;
}

export interface CaseColor {
	id: string;
	name: string;
	/** Hex-Farbe fürs 3D-Material und die UI-Swatches */
	hex: string;
	/** Aufpreis gegenüber der Standardfarbe (z. B. für eloxierte Sonderfarben) */
	priceDeltaCents: number;
}

export interface SwitchOption {
	id: string;
	name: string;
	type: SwitchType;
	/** Preis pro einzelnem Switch – wird mit keyCount multipliziert */
	pricePerSwitchCents: number;
	/** Betätigungskraft in Gramm, rein informativ */
	actuationForceG: number;
	/** Sample-Key für die soundEngine (Datei: /static/audio/<soundProfile>.mp3) */
	soundProfile: SwitchType;
}

export interface KeycapSet {
	id: string;
	name: string;
	/** Farbschema für 3D-Modell und Vorschau */
	colors: {
		base: string;
		accent: string;
		legend: string;
	};
	priceCents: number;
	material: 'PBT' | 'ABS';
}

export interface PlateOption {
	id: string;
	name: string;
	material: 'aluminium' | 'brass' | 'polycarbonate';
	/** Aufpreis gegenüber der Standard-Aluminium-Platte */
	priceDeltaCents: number;
	description: string;
}

export interface LightingOption {
	id: string;
	name: string;
	mode: 'none' | 'white' | 'rgb';
	priceDeltaCents: number;
	description: string;
}

export const baseKits: BaseKit[] = [
	{
		id: 'forge-60',
		name: 'Forge 60',
		layout: '60%',
		keyCount: keyCount('60%'),
		priceCents: 15900,
		description: 'Kompakt, ohne Pfeiltasten. Für Minimalisten.'
	},
	{
		id: 'forge-65',
		name: 'Forge 65',
		layout: '65%',
		keyCount: keyCount('65%'),
		priceCents: 17900,
		description: 'Der Sweet Spot: Pfeiltasten, kein Nummernblock.'
	},
	{
		id: 'forge-75',
		name: 'Forge 75',
		layout: '75%',
		keyCount: keyCount('75%'),
		priceCents: 19900,
		description: 'Mit F-Reihe, trotzdem schmal.'
	},
	{
		id: 'forge-tkl',
		name: 'Forge TKL',
		layout: 'TKL',
		keyCount: keyCount('TKL'),
		priceCents: 22900,
		description: 'Tenkeyless – volle Navigation, ohne Ziffernblock.'
	}
];

export const caseColors: CaseColor[] = [
	{ id: 'graphite', name: 'Graphite', hex: '#2a2a2e', priceDeltaCents: 0 },
	{ id: 'gunmetal', name: 'Gunmetal', hex: '#4b4f57', priceDeltaCents: 0 },
	{ id: 'neon-violet', name: 'Neon Violet', hex: '#7c3aed', priceDeltaCents: 1500 },
	{ id: 'acid-lime', name: 'Acid Lime', hex: '#a3e635', priceDeltaCents: 1500 },
	{ id: 'cyber-cyan', name: 'Cyber Cyan', hex: '#22d3ee', priceDeltaCents: 1500 },
	{ id: 'blood-orange', name: 'Blood Orange', hex: '#f97316', priceDeltaCents: 1500 },
	{ id: 'bone', name: 'Bone', hex: '#e6e1d6', priceDeltaCents: 1000 },
	{ id: 'deep-navy', name: 'Deep Navy', hex: '#1e3a8a', priceDeltaCents: 1000 },
	{ id: 'rose', name: 'Rose', hex: '#be185d', priceDeltaCents: 1500 }
];

export const switchOptions: SwitchOption[] = [
	{
		id: 'ember-linear',
		name: 'Ember Linear',
		type: 'linear',
		pricePerSwitchCents: 65,
		actuationForceG: 45,
		soundProfile: 'linear'
	},
	{
		id: 'quartz-tactile',
		name: 'Quartz Tactile',
		type: 'tactile',
		pricePerSwitchCents: 75,
		actuationForceG: 55,
		soundProfile: 'tactile'
	},
	{
		id: 'relay-clicky',
		name: 'Relay Clicky',
		type: 'clicky',
		pricePerSwitchCents: 70,
		actuationForceG: 50,
		soundProfile: 'clicky'
	}
];

export const keycapSets: KeycapSet[] = [
	{
		id: 'void',
		name: 'Void',
		colors: { base: '#1c1c21', accent: '#3f3f46', legend: '#e4e4e7' },
		priceCents: 7900,
		material: 'PBT'
	},
	{
		id: 'terminal',
		name: 'Terminal',
		colors: { base: '#0f172a', accent: '#22d3ee', legend: '#a5f3fc' },
		priceCents: 8900,
		material: 'PBT'
	},
	{
		id: 'toxic',
		name: 'Toxic',
		colors: { base: '#18181b', accent: '#a3e635', legend: '#ecfccb' },
		priceCents: 8900,
		material: 'PBT'
	},
	{
		id: 'synthwave',
		name: 'Synthwave',
		colors: { base: '#2e1065', accent: '#f472b6', legend: '#fdf2f8' },
		priceCents: 9900,
		material: 'ABS'
	},
	{
		id: 'bone',
		name: 'Bone',
		colors: { base: '#e7e2d6', accent: '#2b2b30', legend: '#1a1a1d' },
		priceCents: 8900,
		material: 'PBT'
	},
	{
		id: 'arctic',
		name: 'Arctic',
		colors: { base: '#e3ebf2', accent: '#22d3ee', legend: '#0f172a' },
		priceCents: 8900,
		material: 'PBT'
	},
	{
		id: 'peach',
		name: 'Peach',
		colors: { base: '#f6d5c3', accent: '#f97316', legend: '#3b1d0f' },
		priceCents: 9400,
		material: 'PBT'
	},
	{
		id: 'olive',
		name: 'Olive',
		colors: { base: '#3f4a2a', accent: '#c5d86d', legend: '#f3f5e6' },
		priceCents: 8900,
		material: 'PBT'
	}
];

export const plateOptions: PlateOption[] = [
	{
		id: 'aluminium',
		name: 'Aluminium',
		material: 'aluminium',
		priceDeltaCents: 0,
		description: 'Ausgewogener Klang, leicht.'
	},
	{
		id: 'polycarbonate',
		name: 'Polycarbonate',
		material: 'polycarbonate',
		priceDeltaCents: 1900,
		description: 'Weicher, tieferer Klang – hörbar in der Vorschau.'
	},
	{
		id: 'brass',
		name: 'Brass',
		material: 'brass',
		priceDeltaCents: 4900,
		description: 'Heller, resonanter Klang – hörbar in der Vorschau.'
	}
];

export interface ConnectivityOption {
	id: string;
	name: string;
	mode: 'wired' | 'wireless';
	priceDeltaCents: number;
	description: string;
}

export const connectivityOptions: ConnectivityOption[] = [
	{
		id: 'wired',
		name: 'Wired',
		mode: 'wired',
		priceDeltaCents: 0,
		description: 'USB-C, abnehmbares Kabel.'
	},
	{
		id: 'wireless',
		name: 'Wireless',
		mode: 'wireless',
		priceDeltaCents: 3900,
		description: 'Bluetooth 5.3 + 2.4 GHz Dongle, USB-C zum Laden. Schalter hinten links.'
	}
];

export interface LanguageOption {
	id: 'en' | 'de';
	name: string;
	hint: string;
}

/** Beschriftung – kein Aufpreis, ändert nur die Legenden */
export const languageOptions: LanguageOption[] = [
	{ id: 'de', name: 'Deutsch', hint: 'QWERTZ · Ü Ö Ä ß' },
	{ id: 'en', name: 'English', hint: 'QWERTY · US-ANSI' }
];

export interface KnobOption {
	id: string;
	name: string;
	enabled: boolean;
	priceDeltaCents: number;
	description: string;
}

export const knobOptions: KnobOption[] = [
	{
		id: 'no-knob',
		name: 'Ohne',
		enabled: false,
		priceDeltaCents: 0,
		description: 'Cleane Oberkante.'
	},
	{
		id: 'knob',
		name: 'Knob',
		enabled: true,
		priceDeltaCents: 1900,
		description: 'Gerändelter Drehregler oben rechts – Lautstärke, Scrollen, Zoom.'
	}
];

/** Gravur: Aufpreis nur, wenn Text vorhanden */
export const ENGRAVING_PRICE_CENTS = 900;
export const ENGRAVING_MAX_LENGTH = 16;
/** Buchstaben, Ziffern, Leerzeichen und ein paar Satzzeichen – kein Unicode-Wildwuchs */
export const ENGRAVING_PATTERN = /^[\p{L}\p{N} .\-_'!&+#]*$/u;

export const lightingOptions: LightingOption[] = [
	{
		id: 'no-light',
		name: 'Keine',
		mode: 'none',
		priceDeltaCents: 0,
		description: 'Unbeleuchtet. Pur.'
	},
	{
		id: 'white-light',
		name: 'White',
		mode: 'white',
		priceDeltaCents: 1900,
		description: 'Warmweiss, Legenden leuchten durch.'
	},
	{
		id: 'rgb-light',
		name: 'RGB Wave',
		mode: 'rgb',
		priceDeltaCents: 2900,
		description: 'RGB-Farbwelle, Legenden leuchten durch.'
	}
];

/** Standardauswahl beim ersten Laden des Konfigurators */
export const defaultSelection = {
	baseKitId: 'forge-65',
	caseColorId: 'graphite',
	switchId: 'ember-linear',
	keycapSetId: 'void',
	plateId: 'aluminium',
	lightingId: 'no-light',
	connectivityId: 'wired',
	languageId: 'de',
	knobId: 'no-knob',
	engraving: ''
} as const;
