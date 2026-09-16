<!--
	Hero + Scroll-Story mit EINEM Board.

	Die 3D-Szene klebt (sticky) und bleibt, während der Text daneben
	durchscrollt. Jeder Schritt setzt Kamera (getweent) und ein paar
	Konfigurations-Felder. Der Kunde personalisiert schon hier – Farbe,
	Keycaps, Gravur – und nimmt die Wahl mit in den Konfigurator.
-->
<script lang="ts">
	import { goto } from '$app/navigation';
	import { Tween } from 'svelte/motion';
	import { cubicInOut } from 'svelte/easing';
	import { BuilderState, builder, formatPrice } from '$lib/stores/builderState.svelte';
	import { showcaseConfig } from '$lib/data/presets';
	import { caseColors, keycapSets, ENGRAVING_MAX_LENGTH } from '$lib/data/catalog';
	import { sanitizeEngraving, type BuildConfig } from '$lib/pricing';
	import { cn } from '$lib/utils';
	import ArrowRight from '@lucide/svelte/icons/arrow-right';

	const scenePromise = import('$lib/components/3d/Scene.svelte');

	// --- Personalisierung: das, was der Kunde im Hero wählt ---
	let caseColorId = $state(showcaseConfig.caseColorId);
	let keycapSetId = $state(showcaseConfig.keycapSetId);
	let engraving = $state('');

	interface Step {
		id: string;
		eyebrow: string;
		title: string;
		text: string;
		camera: { azimuth: number; elevation: number; zoom: number; shiftX?: number; shiftY?: number };
		patch: Partial<BuildConfig>;
	}

	const steps: Step[] = [
		{
			id: 'hero',
			eyebrow: '',
			title: '',
			text: '',
			camera: { azimuth: 0, elevation: 37, zoom: 1 },
			patch: {}
		},
		{
			id: 'licht',
			eyebrow: 'Beleuchtung',
			title: 'Licht, das durch die Tasten kommt.',
			text: 'RGB-Welle oder warmes Weiß. Die Legenden leuchten mit – nicht nur die Spalten dazwischen. Von unten, wie es sein soll.',
			camera: { azimuth: -30, elevation: 18, zoom: 0.6 },
			patch: { lightingId: 'rgb-light' }
		},
		{
			id: 'material',
			eyebrow: 'Material',
			title: 'Messing unter den Fingern.',
			text: 'Die Platte färbt den Klang: Messing klingt hell und lang, Polycarbonat weich. Das Gehäuse hat eine Fase und ein Metallband, das mitgeht.',
			camera: { azimuth: 66, elevation: 11, zoom: 0.5 },
			patch: { lightingId: 'rgb-light', plateId: 'brass' }
		},
		{
			id: 'kabel',
			eyebrow: 'Anschluss',
			title: 'Kabel in deiner Farbe.',
			text: 'Spiralkabel passend zum Keycap-Set, USB-C mit Metallrahmen, Plakette hinten rechts. Oder ohne alles: Wireless mit 2,4 GHz und Bluetooth.',
			camera: { azimuth: 158, elevation: 16, zoom: 0.62 },
			patch: { lightingId: 'rgb-light', connectivityId: 'wired' }
		},
		{
			id: 'zeichen',
			eyebrow: 'Dein Zeichen',
			title: 'Es gibt es genau einmal.',
			text: 'Novelty-Esc mit Glyphe, dein Name lasergraviert auf der vorderen Kante. Tipp ihn oben ein – er steht schon drauf.',
			// Front-Kante rechts ins Bild: Board nach links/oben aus der Mitte schieben
			camera: { azimuth: 28, elevation: 19, zoom: 0.62, shiftX: -0.16, shiftY: -0.12 },
			patch: { lightingId: 'white-light', noveltyId: 'esc-forge' }
		},
		{
			id: 'cta',
			eyebrow: '',
			title: 'Bau deins.',
			text: 'Zehn Minuten im Konfigurator. Alles, was du hier gewählt hast, ist schon drin.',
			camera: { azimuth: 0, elevation: 37, zoom: 1 },
			patch: { lightingId: 'rgb-light' }
		}
	];

	let active = $state(0);
	const step = $derived(steps[active]);

	// Kamera weich zwischen den Schritten fahren
	const opts = { duration: 1100, easing: cubicInOut };
	const az = new Tween(0, opts);
	const el = new Tween(37, opts);
	const zoom = new Tween(1, opts);
	const sx = new Tween(0, opts);
	const sy = new Tween(0, opts);
	$effect(() => {
		az.set(step.camera.azimuth);
		el.set(step.camera.elevation);
		zoom.set(step.camera.zoom);
		sx.set(step.camera.shiftX ?? 0);
		sy.set(step.camera.shiftY ?? 0);
	});

	// Board-State: Showcase + Personalisierung + Schritt-Patch
	const showcase = new BuilderState();
	const personal = $derived<Partial<BuildConfig>>({ caseColorId, keycapSetId, engraving });
	$effect(() => {
		showcase.load({ ...showcaseConfig, deskmatId: 'no-mat', ...personal, ...step.patch });
	});

	// Schritte beobachten: der, der die Bildschirmmitte kreuzt, ist aktiv
	let stepEls = $state<HTMLElement[]>([]);
	$effect(() => {
		const io = new IntersectionObserver(
			(entries) => {
				for (const e of entries) {
					if (e.isIntersecting) active = Number((e.target as HTMLElement).dataset.step);
				}
			},
			{ rootMargin: '-45% 0px -45% 0px', threshold: 0 }
		);
		stepEls.forEach((e) => e && io.observe(e));
		return () => io.disconnect();
	});

	// Tipp-Echo: was der Besucher auf seiner Tastatur schreibt, erscheint am Board
	let typed = $state('');
	function onKey(e: KeyboardEvent) {
		const t = e.target as HTMLElement | null;
		if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
		if (e.key === 'Backspace') typed = typed.slice(0, -1);
		else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) typed = (typed + e.key).slice(-26);
	}

	function start() {
		builder.load(showcase.snapshot());
		goto('/build');
	}

	const heroIsActive = $derived(active === 0 || active === steps.length - 1);
</script>

<svelte:window onkeydown={onKey} />

<section class="relative">
	<div class="mx-auto max-w-7xl px-6 lg:grid lg:grid-cols-[5fr_7fr] lg:gap-8">
		<!-- Sticky-Board: bleibt stehen, Kamera fährt -->
		<div class="sticky top-0 z-0 -mx-6 h-[46vh] min-h-[300px] lg:order-2 lg:mx-0 lg:h-screen">
			<div class="absolute inset-0">
				{#await scenePromise}
					<div class="flex h-full items-center justify-center">
						<span
							class="animate-pulse font-mono text-[10px] tracking-[0.3em] text-ink-faint uppercase"
						>
							Loading
						</span>
					</div>
				{:then { default: Scene }}
					<Scene
						build={showcase}
						transparent
						interactive={heroIsActive}
						autoRotate={heroIsActive}
						azimuth={az.current}
						elevation={el.current}
						zoom={zoom.current}
						shiftX={sx.current}
						shiftY={sy.current}
					/>
				{/await}
			</div>
			<!-- Tipp-Echo -->
			<div class="pointer-events-none absolute inset-x-6 bottom-4 lg:inset-x-0">
				{#if typed}
					<p class="truncate font-display text-2xl font-bold text-ink/80 lg:text-3xl">{typed}</p>
				{:else}
					<p class="font-mono text-[10px] tracking-[0.2em] text-ink-faint uppercase">
						Tipp auf deiner Tastatur ↗ das Board tippt mit
					</p>
				{/if}
			</div>
		</div>

		<!-- Text-Spalte: Hero + Story-Schritte -->
		<div class="relative z-10 min-w-0 lg:order-1">
			<!-- Schritt 0: Hero mit Personalisierung -->
			<div
				bind:this={stepEls[0]}
				data-step="0"
				class="flex min-h-[70vh] flex-col justify-center py-10 lg:min-h-screen lg:py-16"
			>
				<p class="text-brand font-mono text-[11px] tracking-[0.25em] uppercase">
					<span class="text-ember">Live</span> · Das Board rechts ist echt gerendert
				</p>
				<h2
					class="mt-4 font-display text-4xl leading-[0.95] font-extrabold tracking-tight text-ink sm:text-5xl lg:text-6xl"
				>
					Mach es <span class="text-brand">deins.</span>
				</h2>
				<p class="mt-5 max-w-md text-base leading-relaxed text-ink-muted">
					Farbe, Keycaps, dein Name – und du siehst es sofort. Dreh es mit der Maus, tipp auf deiner
					Tastatur, scroll für die Details.
				</p>

				<!-- Personalisierung: wirkt sofort am Board rechts -->
				<div
					class="mt-8 flex flex-col gap-4 rounded-2xl border border-line bg-surface/60 p-4 backdrop-blur"
				>
					<div class="flex items-center justify-between">
						<span class="font-mono text-[10px] tracking-[0.2em] text-ink-faint uppercase">Case</span
						>
						<span class="font-mono text-[10px] text-ink-muted">
							{caseColors.find((c) => c.id === caseColorId)?.name}
						</span>
					</div>
					<div class="flex flex-wrap gap-2">
						{#each caseColors as color (color.id)}
							<button
								class={cn(
									'size-7 rounded-full border-2 transition-transform hover:scale-110',
									caseColorId === color.id ? 'border-ink' : 'border-line'
								)}
								style:background={color.hex}
								aria-label={color.name}
								aria-pressed={caseColorId === color.id}
								onclick={() => (caseColorId = color.id)}
							></button>
						{/each}
					</div>

					<div class="flex items-center justify-between">
						<span class="font-mono text-[10px] tracking-[0.2em] text-ink-faint uppercase"
							>Keycaps</span
						>
						<span class="font-mono text-[10px] text-ink-muted">
							{keycapSets.find((k) => k.id === keycapSetId)?.name}
						</span>
					</div>
					<div class="flex flex-wrap gap-2">
						{#each keycapSets as set (set.id)}
							<button
								class={cn(
									'flex h-7 w-10 overflow-hidden rounded-[4px] border-2 transition-transform hover:scale-105',
									keycapSetId === set.id ? 'border-ink' : 'border-line'
								)}
								aria-label={set.name}
								aria-pressed={keycapSetId === set.id}
								onclick={() => (keycapSetId = set.id)}
							>
								<span class="flex-[3]" style:background={set.colors.base}></span>
								<span class="flex-[2]" style:background={set.colors.accent}></span>
							</button>
						{/each}
					</div>

					<label class="flex items-center gap-3">
						<span class="shrink-0 font-mono text-[10px] tracking-[0.2em] text-ink-faint uppercase"
							>Gravur</span
						>
						<input
							type="text"
							maxlength={ENGRAVING_MAX_LENGTH}
							placeholder="Dein Name"
							value={engraving}
							oninput={(e) => (engraving = sanitizeEngraving(e.currentTarget.value))}
							class="min-w-0 flex-1 rounded-panel border border-line bg-void/60 px-3 py-1.5 font-mono text-sm tracking-[0.12em] text-ink uppercase placeholder:tracking-normal placeholder:text-ink-faint placeholder:normal-case focus:border-ember focus:outline-none"
						/>
					</label>
				</div>

				<div class="mt-6 flex flex-wrap items-center gap-4">
					<button
						class="inline-flex h-11 items-center gap-2 rounded-full bg-brand px-6 text-sm font-semibold text-void shadow-[0_0_32px_oklch(0.72_0.2_20/0.45)] transition-transform hover:scale-[1.03] focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:outline-none"
						onclick={start}
					>
						Weiter im Konfigurator <ArrowRight class="size-4" />
					</button>
					<span class="font-mono text-[11px] text-ink-muted">
						ab {formatPrice(showcase.price.total)} so wie es da steht
					</span>
				</div>
				<p
					class="mt-8 hidden font-mono text-[10px] tracking-[0.2em] text-ink-faint uppercase lg:block"
				>
					↓ Scroll für die Details
				</p>
			</div>

			<!-- Schritte 1–n: Story -->
			{#each steps.slice(1) as s, i (s.id)}
				{@const idx = i + 1}
				<div
					bind:this={stepEls[idx]}
					data-step={idx}
					class={cn(
						'flex min-h-[60vh] flex-col justify-center py-10 transition-opacity duration-500 lg:min-h-[85vh]',
						active === idx ? 'opacity-100' : 'opacity-40'
					)}
				>
					{#if s.eyebrow}
						<p class="text-brand font-mono text-[11px] tracking-[0.25em] uppercase">
							<span class="text-ember">0{idx}</span> · {s.eyebrow}
						</p>
					{/if}
					<h2 class="mt-3 font-display text-3xl font-bold text-ink sm:text-5xl">{s.title}</h2>
					<p class="mt-4 max-w-md text-base leading-relaxed text-ink-muted">{s.text}</p>
					{#if s.id === 'cta'}
						<div class="mt-8">
							<button
								class="inline-flex h-12 items-center gap-2 rounded-full bg-brand px-8 text-sm font-semibold text-void shadow-[0_0_40px_oklch(0.72_0.2_20/0.45)] transition-transform hover:scale-[1.03]"
								onclick={start}
							>
								Konfigurator öffnen <ArrowRight class="size-4" />
							</button>
						</div>
					{/if}
				</div>
			{/each}
		</div>
	</div>
</section>
