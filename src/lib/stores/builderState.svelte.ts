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
 *
 * Die eigentliche Preislogik liegt in $lib/pricing.ts (reine Funktionen),
 * damit der Server denselben Code für die Checkout-Validierung nutzt.
 */
import {
	defaultSelection,
	baseKits,
	caseColors,
	switchOptions,
	keycapSets,
	plateOptions,
	lightingOptions,
	connectivityOptions,
	noveltyOptions,
	deskmatOptions
} from '$lib/data/catalog';
import {
	resolveBuild,
	computePrice,
	buildLabel,
	type BuildConfig,
	type PriceBreakdown,
	type ResolvedBuild
} from '$lib/pricing';

export type { BuildConfig, PriceBreakdown };

export class BuilderState {
	// --- Rohauswahl (nur IDs, damit der State trivial serialisierbar ist) ---
	baseKitId = $state<string>(defaultSelection.baseKitId);
	caseColorId = $state<string>(defaultSelection.caseColorId);
	switchId = $state<string>(defaultSelection.switchId);
	keycapSetId = $state<string>(defaultSelection.keycapSetId);
	plateId = $state<string>(defaultSelection.plateId);
	lightingId = $state<string>(defaultSelection.lightingId);
	connectivityId = $state<string>(defaultSelection.connectivityId);
	languageId = $state<string>(defaultSelection.languageId);
	noveltyId = $state<string>(defaultSelection.noveltyId);
	deskmatId = $state<string>(defaultSelection.deskmatId);
	engraving = $state<string>(defaultSelection.engraving);

	// --- Aufgelöste Katalogobjekte ---
	private resolved: ResolvedBuild = $derived(resolveBuild(this.snapshot()));

	get baseKit() {
		return this.resolved.baseKit;
	}
	get caseColor() {
		return this.resolved.caseColor;
	}
	get switch() {
		return this.resolved.switch;
	}
	get keycapSet() {
		return this.resolved.keycapSet;
	}
	get plate() {
		return this.resolved.plate;
	}
	get lighting() {
		return this.resolved.lighting;
	}
	get connectivity() {
		return this.resolved.connectivity;
	}
	get language() {
		return this.resolved.language;
	}
	get novelty() {
		return this.resolved.novelty;
	}
	get deskmat() {
		return this.resolved.deskmat;
	}

	// --- Pricing Engine: rechnet sich neu, sobald sich irgendeine ID ändert ---
	price: PriceBreakdown = $derived(computePrice(this.resolved));

	/** Kurzer, lesbarer Name der aktuellen Konfiguration */
	label: string = $derived(buildLabel(this.resolved));

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
	setConnectivity(id: string) {
		this.connectivityId = id;
	}
	setLanguage(id: string) {
		this.languageId = id;
	}
	setNovelty(id: string) {
		this.noveltyId = id;
	}
	setDeskmat(id: string) {
		this.deskmatId = id;
	}
	setEngraving(text: string) {
		this.engraving = text;
	}

	reset() {
		this.load(defaultSelection);
	}

	/** Würfeln: zufälliger Build, Sprache und Gravur bleiben */
	randomize() {
		const pick = <T extends { id: string }>(list: T[]) =>
			list[Math.floor(Math.random() * list.length)].id;
		this.load({
			baseKitId: pick(baseKits),
			caseColorId: pick(caseColors),
			switchId: pick(switchOptions),
			keycapSetId: pick(keycapSets),
			plateId: pick(plateOptions),
			lightingId: pick(lightingOptions),
			connectivityId: pick(connectivityOptions),
			noveltyId: pick(noveltyOptions),
			deskmatId: pick(deskmatOptions),
			languageId: this.languageId,
			engraving: this.engraving
		});
	}

	/** Snapshot ohne Reaktivität – sicher zum Speichern/Versenden */
	snapshot(): BuildConfig {
		return {
			baseKitId: this.baseKitId,
			caseColorId: this.caseColorId,
			switchId: this.switchId,
			keycapSetId: this.keycapSetId,
			plateId: this.plateId,
			lightingId: this.lightingId,
			connectivityId: this.connectivityId,
			languageId: this.languageId,
			noveltyId: this.noveltyId,
			deskmatId: this.deskmatId,
			engraving: this.engraving
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
		this.connectivityId = config.connectivityId;
		this.languageId = config.languageId;
		this.noveltyId = config.noveltyId;
		this.deskmatId = config.deskmatId;
		this.engraving = config.engraving;
	}
}

/** App-weite Singleton-Instanz */
export const builder = new BuilderState();

// formatPrice lebt in pricing.ts (auch serverseitig nutzbar), hier nur re-exportiert
export { formatPrice } from '$lib/pricing';
