/**
 * Pricing Engine – reine Funktionen, keine Reaktivität.
 *
 * Wird an zwei Stellen benutzt:
 * - Client: builderState leitet `price` daraus ab (live im Konfigurator)
 * - Server: /api/checkout rechnet den Preis aus den IDs NEU, bevor er zu
 *   Stripe geht. Der Client schickt nie Beträge, nur IDs.
 */
import {
	baseKits,
	caseColors,
	switchOptions,
	keycapSets,
	plateOptions,
	lightingOptions,
	connectivityOptions,
	type BaseKit,
	type CaseColor,
	type SwitchOption,
	type KeycapSet,
	type PlateOption,
	type LightingOption,
	type ConnectivityOption
} from '$lib/data/catalog';

/** Serialisierbarer Snapshot – wandert in den Cart und zu Stripe */
export interface BuildConfig {
	baseKitId: string;
	caseColorId: string;
	switchId: string;
	keycapSetId: string;
	plateId: string;
	lightingId: string;
	connectivityId: string;
}

export interface ResolvedBuild {
	baseKit: BaseKit;
	caseColor: CaseColor;
	switch: SwitchOption;
	keycapSet: KeycapSet;
	plate: PlateOption;
	lighting: LightingOption;
	connectivity: ConnectivityOption;
}

export interface PriceBreakdown {
	baseKit: number;
	caseColor: number;
	switches: number;
	keycaps: number;
	plate: number;
	lighting: number;
	connectivity: number;
	total: number;
}

function findOrFallback<T extends { id: string }>(list: T[], id: string): T {
	// Fallback auf das erste Element, damit ein veralteter/ungültiger
	// Snapshot (z. B. aus localStorage) den Konfigurator nie kaputt macht.
	return list.find((item) => item.id === id) ?? list[0];
}

/** IDs → Katalogobjekte (tolerant gegenüber unbekannten IDs) */
export function resolveBuild(config: BuildConfig): ResolvedBuild {
	return {
		baseKit: findOrFallback(baseKits, config.baseKitId),
		caseColor: findOrFallback(caseColors, config.caseColorId),
		switch: findOrFallback(switchOptions, config.switchId),
		keycapSet: findOrFallback(keycapSets, config.keycapSetId),
		plate: findOrFallback(plateOptions, config.plateId),
		lighting: findOrFallback(lightingOptions, config.lightingId),
		connectivity: findOrFallback(connectivityOptions, config.connectivityId)
	};
}

/** Strenge Variante für den Server: unbekannte IDs sind ein Fehler, kein Fallback */
export function isValidConfig(config: unknown): config is BuildConfig {
	if (!config || typeof config !== 'object') return false;
	const c = config as Record<string, unknown>;
	const has = (list: { id: string }[], id: unknown) =>
		typeof id === 'string' && list.some((x) => x.id === id);
	return (
		has(baseKits, c.baseKitId) &&
		has(caseColors, c.caseColorId) &&
		has(switchOptions, c.switchId) &&
		has(keycapSets, c.keycapSetId) &&
		has(plateOptions, c.plateId) &&
		has(lightingOptions, c.lightingId) &&
		has(connectivityOptions, c.connectivityId)
	);
}

/** Alles in Cent, Integer. */
export function computePrice(build: ResolvedBuild): PriceBreakdown {
	const baseKit = build.baseKit.priceCents;
	const caseColor = build.caseColor.priceDeltaCents;
	const switches = build.switch.pricePerSwitchCents * build.baseKit.keyCount;
	const keycaps = build.keycapSet.priceCents;
	const plate = build.plate.priceDeltaCents;
	const lighting = build.lighting.priceDeltaCents;
	const connectivity = build.connectivity.priceDeltaCents;
	return {
		baseKit,
		caseColor,
		switches,
		keycaps,
		plate,
		lighting,
		connectivity,
		total: baseKit + caseColor + switches + keycaps + plate + lighting + connectivity
	};
}

/** Kurzer, lesbarer Name (Cart-Zeile, Stripe-Line-Item) */
export function buildLabel(build: ResolvedBuild): string {
	return `${build.baseKit.name} · ${build.caseColor.name} · ${build.switch.name} · ${build.keycapSet.name} · ${build.plate.name}-Plate`;
}

/** Ausführliche Beschreibung für Stripe / Bestellbestätigung */
export function buildDescription(build: ResolvedBuild): string {
	return [
		`${build.baseKit.layout}-Layout, ${build.baseKit.keyCount} Keys`,
		`Case ${build.caseColor.name}`,
		`${build.switch.name} (${build.switch.type})`,
		`Keycaps ${build.keycapSet.name} ${build.keycapSet.material}`,
		`${build.plate.name}-Plate`,
		`Lighting ${build.lighting.name}`,
		build.connectivity.name
	].join(' · ');
}
