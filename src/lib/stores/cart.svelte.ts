/**
 * Warenkorb – persistent (localStorage) und über Tabs synchron.
 *
 * Gespeichert werden nur Konfigurations-IDs + Menge. Preise werden beim
 * Lesen aus dem Katalog neu berechnet, damit ein alter Cart nach einer
 * Preisänderung nicht den alten Preis behält – und der Server rechnet
 * beim Checkout sowieso nochmal selbst.
 */
import { browser } from '$app/environment';
import { resolveBuild, computePrice, buildLabel, type BuildConfig } from '$lib/pricing';

const STORAGE_KEY = 'switchforge.cart.v2'; // v2: noveltyId statt knobId
const MAX_QTY = 10;

export interface CartItem {
	id: string;
	config: BuildConfig;
	qty: number;
}

function sameConfig(a: BuildConfig, b: BuildConfig) {
	return (Object.keys(a) as (keyof BuildConfig)[]).every((k) => a[k] === b[k]);
}

function readStorage(): CartItem[] {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return [];
		const parsed = JSON.parse(raw);
		return Array.isArray(parsed) ? parsed : [];
	} catch {
		return [];
	}
}

class CartState {
	items = $state<CartItem[]>([]);
	/** Drawer offen? Lebt hier, damit "In den Warenkorb" ihn von überall öffnen kann */
	open = $state(false);

	/** Zeilen mit aufgelösten Katalogobjekten und Preisen – fürs UI */
	lines = $derived(
		this.items.map((item) => {
			const build = resolveBuild(item.config);
			const price = computePrice(build);
			return {
				...item,
				build,
				label: buildLabel(build),
				unitCents: price.total,
				lineCents: price.total * item.qty
			};
		})
	);

	count = $derived(this.items.reduce((n, i) => n + i.qty, 0));
	totalCents = $derived(this.lines.reduce((sum, l) => sum + l.lineCents, 0));

	constructor() {
		if (!browser) return;
		this.items = readStorage();

		// Persistenz: jede Änderung an items → localStorage.
		// $effect.root, weil wir hier ausserhalb einer Komponente sind.
		$effect.root(() => {
			$effect(() => {
				localStorage.setItem(STORAGE_KEY, JSON.stringify(this.items));
			});
		});

		// Tab-Sync: ändert ein anderer Tab den Cart, ziehen wir nach
		window.addEventListener('storage', (e) => {
			if (e.key === STORAGE_KEY) this.items = readStorage();
		});
	}

	add(config: BuildConfig) {
		const existing = this.items.find((i) => sameConfig(i.config, config));
		if (existing) {
			existing.qty = Math.min(existing.qty + 1, MAX_QTY);
		} else {
			this.items.push({ id: crypto.randomUUID(), config: { ...config }, qty: 1 });
		}
	}

	setQty(id: string, qty: number) {
		const item = this.items.find((i) => i.id === id);
		if (!item) return;
		if (qty <= 0) this.remove(id);
		else item.qty = Math.min(qty, MAX_QTY);
	}

	remove(id: string) {
		this.items = this.items.filter((i) => i.id !== id);
	}

	clear() {
		this.items = [];
	}

	/** Payload für POST /api/checkout – nur IDs und Mengen */
	toCheckoutPayload() {
		return { items: this.items.map((i) => ({ config: i.config, qty: i.qty })) };
	}
}

export const cart = new CartState();
