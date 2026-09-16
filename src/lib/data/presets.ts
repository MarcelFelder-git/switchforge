/**
 * Starter-Builds: vollständige Konfigurationen als Einstieg.
 * Jede lädt per builder.load() in den Konfigurator – nichts Magisches,
 * nur ein BuildConfig mit Namen und einem Satz Beschreibung.
 */
import type { BuildConfig } from '$lib/pricing';

export interface Preset {
	id: string;
	name: string;
	tagline: string;
	config: BuildConfig;
}

/** Das Board im Hero der Landing Page */
export const showcaseConfig: BuildConfig = {
	baseKitId: 'forge-75',
	caseColorId: 'graphite',
	switchId: 'ember-linear',
	keycapSetId: 'terminal',
	plateId: 'brass',
	lightingId: 'rgb-light',
	connectivityId: 'wired',
	languageId: 'de',
	noveltyId: 'esc-forge',
	deskmatId: 'mat-charcoal',
	engraving: 'SWITCHFORGE'
};

export const presets: Preset[] = [
	{
		id: 'nightshift',
		name: 'Nightshift',
		tagline: 'Dunkel, leise, Messing. Für lange Abende.',
		config: {
			baseKitId: 'forge-65',
			caseColorId: 'graphite',
			switchId: 'ember-linear',
			keycapSetId: 'void',
			plateId: 'brass',
			lightingId: 'no-light',
			connectivityId: 'wireless',
			languageId: 'de',
			noveltyId: 'esc-forge',
			deskmatId: 'no-mat',
			engraving: ''
		}
	},
	{
		id: 'terminal',
		name: 'Terminal',
		tagline: 'Cyan auf Schwarz, RGB-Welle, taktil.',
		config: {
			baseKitId: 'forge-75',
			caseColorId: 'cyber-cyan',
			switchId: 'quartz-tactile',
			keycapSetId: 'terminal',
			plateId: 'aluminium',
			lightingId: 'rgb-light',
			connectivityId: 'wired',
			languageId: 'de',
			noveltyId: 'esc-bolt',
			deskmatId: 'mat-match',
			engraving: ''
		}
	},
	{
		id: 'bone',
		name: 'Bone',
		tagline: 'Hell, warm, clicky. Das Gegenteil von Gaming.',
		config: {
			baseKitId: 'forge-60',
			caseColorId: 'bone',
			switchId: 'relay-clicky',
			keycapSetId: 'peach',
			plateId: 'polycarbonate',
			lightingId: 'white-light',
			connectivityId: 'wired',
			languageId: 'en',
			noveltyId: 'esc-diamond',
			deskmatId: 'no-mat',
			engraving: ''
		}
	}
];
