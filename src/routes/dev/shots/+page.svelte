<!--
	Dev-Werkzeug: Produkt-Renders aus der 3D-Szene.
	Jeder Shot = Konfiguration + Kamerawinkel. "Alle rendern" stellt sie
	nacheinander ein, wartet auf Fonts/Bloom, liest den Canvas als WebP und
	schickt ihn an /api/dev/shot, das nach static/img/shots schreibt.
	Nur im Dev-Server erreichbar.
-->
<script lang="ts">
	import { dev } from '$app/environment';
	import { BuilderState } from '$lib/stores/builderState.svelte';
	import { presets, showcaseConfig } from '$lib/data/presets';
	import type { BuildConfig } from '$lib/pricing';
	import Scene from '$lib/components/3d/Scene.svelte';

	interface Shot {
		name: string;
		config: BuildConfig;
		azimuth: number;
		elevation: number;
		zoom: number;
		shiftY?: number;
	}

	const byId = Object.fromEntries(presets.map((p) => [p.id, p.config]));

	const shots: Shot[] = [
		{ name: 'hero', config: showcaseConfig, azimuth: 26, elevation: 30, zoom: 0.92 },
		{ name: 'nightshift', config: byId.nightshift, azimuth: -24, elevation: 32, zoom: 1 },
		{ name: 'terminal', config: byId.terminal, azimuth: 22, elevation: 34, zoom: 1 },
		{ name: 'bone', config: byId.bone, azimuth: 8, elevation: 48, zoom: 1 },
		{ name: 'detail-side', config: showcaseConfig, azimuth: 62, elevation: 11, zoom: 0.55 },
		{ name: 'detail-top', config: showcaseConfig, azimuth: -6, elevation: 72, zoom: 0.72 },
		{ name: 'detail-rear', config: showcaseConfig, azimuth: 160, elevation: 18, zoom: 0.7 },
		{
			name: 'lighting',
			config: { ...byId.terminal, caseColorId: 'graphite' },
			azimuth: -34,
			elevation: 22,
			zoom: 0.8
		},
		// Vorlagen für KI-Lifestyle-Shots (Gemini): sauber, ohne Matte
		{
			name: 'src-bone-side',
			config: { ...byId.bone, deskmatId: 'no-mat' },
			azimuth: 48,
			elevation: 14,
			zoom: 0.8
		},
		{
			name: 'src-nightshift-top',
			config: { ...byId.nightshift, deskmatId: 'no-mat' },
			azimuth: 0,
			elevation: 62,
			zoom: 0.85
		},
		{
			name: 'src-terminal-front',
			config: { ...byId.terminal, deskmatId: 'no-mat' },
			azimuth: -12,
			elevation: 24,
			zoom: 0.85
		},
		{
			name: 'src-arctic',
			config: {
				...byId.bone,
				keycapSetId: 'arctic',
				caseColorId: 'bone',
				lightingId: 'white-light',
				deskmatId: 'no-mat'
			},
			azimuth: 22,
			elevation: 30,
			zoom: 0.9
		}
	];

	const build = new BuilderState();
	let current = $state<Shot>(shots[0]);
	let log = $state<string[]>([]);
	let container = $state<HTMLDivElement>();

	function apply(shot: Shot) {
		current = shot;
		build.load(shot.config);
	}
	apply(shots[0]);

	const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

	async function capture(shot: Shot) {
		apply(shot);
		await wait(2200); // Fonts laden, Bloom einschwingen, Geometrie neu
		const canvas = container?.querySelector('canvas');
		if (!canvas) throw new Error('kein Canvas');
		const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/webp', 0.9));
		if (!blob) throw new Error('toBlob fehlgeschlagen');
		const res = await fetch(`/api/dev/shot?name=${shot.name}`, { method: 'POST', body: blob });
		const data = await res.json();
		log.push(`${shot.name}: ${(data.bytes / 1024).toFixed(0)} KB`);
	}

	async function renderAll() {
		log = [];
		for (const shot of shots) await capture(shot);
		log.push('fertig');
	}

	// Für Automatisierung von aussen (Browser-Tooling): einzelne Shots ansteuern.
	// Hintergrund-Tabs feuern kein requestAnimationFrame – dann rendert Threlte
	// nicht, und toBlob liefert den alten Frame. Deshalb Schritt für Schritt.
	$effect(() => {
		const w = window as unknown as {
			__shots?: string[];
			__apply?: (name: string) => void;
			__capture?: (name: string) => Promise<string>;
		};
		w.__shots = shots.map((s) => s.name);
		w.__apply = (name) => {
			const shot = shots.find((s) => s.name === name);
			if (shot) apply(shot);
		};
		w.__capture = async (name) => {
			const shot = shots.find((s) => s.name === name);
			if (!shot) return 'unbekannt';
			const canvas = container?.querySelector('canvas');
			if (!canvas) return 'kein Canvas';
			const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/webp', 0.9));
			if (!blob) return 'toBlob fehlgeschlagen';
			const res = await fetch(`/api/dev/shot?name=${shot.name}`, { method: 'POST', body: blob });
			const data = await res.json();
			return `${shot.name}: ${(data.bytes / 1024).toFixed(0)} KB`;
		};
	});
</script>

{#if !dev}
	<p class="p-6 font-mono text-sm">Nur im Dev-Server.</p>
{:else}
	<div class="flex gap-6 p-6">
		<div bind:this={container} class="h-[1000px] w-[1600px] shrink-0 bg-void">
			<Scene
				{build}
				interactive={false}
				preserve
				azimuth={current.azimuth}
				elevation={current.elevation}
				zoom={current.zoom}
			/>
		</div>
		<div class="font-mono text-xs">
			<button id="render-all" class="rounded border border-line px-3 py-2" onclick={renderAll}>
				Alle rendern
			</button>
			<ul class="mt-4 space-y-1">
				{#each shots as shot (shot.name)}
					<li>
						<button class="text-ink-muted hover:text-ink" onclick={() => apply(shot)}
							>{shot.name}</button
						>
					</li>
				{/each}
			</ul>
			<pre class="mt-4 text-ink-faint">{log.join('\n')}</pre>
		</div>
	</div>
{/if}
