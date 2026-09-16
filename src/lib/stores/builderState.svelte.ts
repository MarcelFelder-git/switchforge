/**
 * Globaler Konfigurator-State (Svelte 5 Runes).
 *
 * Warum eine Klasse statt loser $state-Variablen?
 * - Aus einem .svelte.ts-Modul kann reaktiver State nicht direkt
 *   re-exportiert werden (`export let x = $state()` ist verboten), aber
 *   Klassenfelder mit $state/$derived funktionieren überall.
 * - Ein einziges `builder`-Objekt wird von 3D-Szene, Panel, Sound-Preview
 *   und Cart gleichzeitig gelesen – jede Änderung propagiert feingranular
 *   nur an die Stellen, die das jeweilige Feld tatsächlich lesen.
 */
import {
	baseKits,
	caseColors,
	switchOptions,
	keycapSets,
	plateOptions,
	lightingOptions,
	defaultSelection,
	CURRENCY,
	type BaseKit,
	type CaseColor,
	type SwitchOption,
	type KeycapSet,
	type PlateOption,
	type LightingOption
} from '$lib/data/catalog';

/** Serialisierbarer Snapshot – wandert in den Cart und zu Stripe */
export interface BuildConfig {
	baseKitId: string;
	caseColorId: string;
	switchId: string;
	keycapSetId: string;
	plateId: string;
	lightingId: string;
}

export interface PriceBreakdown {
	baseKit: number;
	caseColor: number;
	switches: number;
	keycaps: number;
	plate: number;
	lighting: number;
	total: number;
}

function findOrFallback<T extends { id: string }>(list: T[], id: string): T {
	// Fallback auf das erste Element, damit ein veralteter/ungültiger
	// Snapshot (z. B. aus localStorage) den Konfigurator nie kaputt macht.
	return list.find((item) => item.id === id) ?? list[0];
}

export class BuilderState {
	// --- Rohauswahl (nur IDs, damit der State trivial serialisierbar ist) ---
	baseKitId = $state<string>(defaultSelection.baseKitId);
	caseColorId = $state<string>(defaultSelection.caseColorId);
	switchId = $state<string>(defaultSelection.switchId);
	keycapSetId = $state<string>(defaultSelection.keycapSetId);
	plateId = $state<string>(defaultSelection.plateId);
	lightingId = $state<string>(defaultSelection.lightingId);

	// --- Aufgelöste Katalogobjekte ---
	baseKit: BaseKit = $derived(findOrFallback(baseKits, this.baseKitId));
	caseColor: CaseColor = $derived(findOrFallback(caseColors, this.caseColorId));
	switch: SwitchOption = $derived(findOrFallback(switchOptions, this.switchId));
	keycapSet: KeycapSet = $derived(findOrFallback(keycapSets, this.keycapSetId));
	plate: PlateOption = $derived(findOrFallback(plateOptions, this.plateId));
	lighting: LightingOption = $derived(findOrFallback(lightingOptions, this.lightingId));

	// --- Pricing Engine ---
	// Alles in Cent; die Summe rechnet sich automatisch neu, sobald sich
	// irgendeine der Abhängigkeiten ändert.
	price: PriceBreakdown = $derived.by(() => {
		const baseKit = this.baseKit.priceCents;
		const caseColor = this.caseColor.priceDeltaCents;
		const switches = this.switch.pricePerSwitchCents * this.baseKit.keyCount;
		const keycaps = this.keycapSet.priceCents;
		const plate = this.plate.priceDeltaCents;
		const lighting = this.lighting.priceDeltaCents;
		return {
			baseKit,
			caseColor,
			switches,
			keycaps,
			plate,
			lighting,
			total: baseKit + caseColor + switches + keycaps + plate + lighting
		};
	});

	/** Kurzer, lesbarer Name der aktuellen Konfiguration (Cart-Zeile, Stripe-Line-Item) */
	label: string = $derived(
		`${this.baseKit.name} · ${this.caseColor.name} · ${this.switch.name} · ${this.keycapSet.name} · ${this.plate.name}-Plate`
	);

	// --- Mutationen ---
	setBaseKit(id: string) {
		this.baseKitId = id;
	}
	setCaseColor(id: string) {
		this.caseColorId = id;
	}
	setSwitch(id: string) {
		this.switchId = id;
	}
	setKeycapSet(id: string) {
		this.keycapSetId = id;
	}
	setPlate(id: string) {
		this.plateId = id;
	}
	setLighting(id: string) {
		this.lightingId = id;
	}

	reset() {
		this.load(defaultSelection);
	}

	/** Snapshot ohne Reaktivität – sicher zum Speichern/Versenden */
	snapshot(): BuildConfig {
		return {
			baseKitId: this.baseKitId,
			caseColorId: this.caseColorId,
			switchId: this.switchId,
			keycapSetId: this.keycapSetId,
			plateId: this.plateId,
			lightingId: this.lightingId
		};
	}

	/** Snapshot wieder einspielen (z. B. "Konfiguration bearbeiten" aus dem Cart) */
	load(config: BuildConfig) {
		this.baseKitId = config.baseKitId;
		this.caseColorId = config.caseColorId;
		this.switchId = config.switchId;
		this.keycapSetId = config.keycapSetId;
		this.plateId = config.plateId;
		this.lightingId = config.lightingId;
	}
}

/** App-weite Singleton-Instanz */
export const builder = new BuilderState();

// --- Helfer ---

const priceFormatter = new Intl.NumberFormat('de-CH', {
	style: 'currency',
	currency: CURRENCY
});

/** Cent → formatierter Preisstring, z. B. 17900 → "€ 179.00" */
export function formatPrice(cents: number): string {
	return priceFormatter.format(cents / 100);
}
