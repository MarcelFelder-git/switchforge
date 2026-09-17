<!--
	Auswahl-Panel. Schreibt ausschliesslich über die builder-Setter,
	liest die aktuelle Auswahl aus den $derived-Feldern.

	Aufbau: jede Section hat Nummer, Titel und rechts die aktuelle Auswahl –
	so sieht man die ganze Konfiguration, ohne zu scrollen.
-->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import { builder, formatPrice } from '$lib/stores/builderState.svelte';
	import {
		baseKits,
		caseColors,
		switchOptions,
		keycapSets,
		plateOptions,
		lightingOptions,
		connectivityOptions,
		languageOptions,
		noveltyOptions,
		deskmatOptions,
		ENGRAVING_MAX_LENGTH,
		ENGRAVING_PRICE_CENTS,
		type SwitchType
	} from '$lib/data/catalog';
	import { sanitizeEngraving } from '$lib/pricing';
	import { cn } from '$lib/utils';
	import LayoutSilhouette from './LayoutSilhouette.svelte';
	import ForceCurve from './ForceCurve.svelte';
	import Cable from '@lucide/svelte/icons/cable';
	import Bluetooth from '@lucide/svelte/icons/bluetooth';

	/** Metall-Optik der Platten als CSS-Verlauf – kein Bild nötig */
	const PLATE_SWATCH: Record<string, string> = {
		aluminium: 'linear-gradient(135deg,#c9ced6 0%,#8d939c 45%,#d6dae0 100%)',
		brass: 'linear-gradient(135deg,#e2c15a 0%,#a67c1c 45%,#f0d77a 100%)',
		polycarbonate: 'linear-gradient(135deg,#f3f6f9 0%,#c9d3dd 45%,#ffffff 100%)'
	};

	// Weich: grosse Radien, 300 ms fuer alles, leichtes Anheben beim Hover
	const option =
		'group rounded-panel border text-left transition-all duration-300 ease-out outline-none focus-visible:ring-2 focus-visible:ring-ring/60 hover:-translate-y-0.5';
	const idle = 'border-line/70 bg-void/40 hover:border-steel hover:bg-surface-raised/60';
	const active =
		'border-ember/80 bg-ember/10 shadow-[0_8px_30px_-8px_oklch(0.72_0.19_45/0.45)] ring-1 ring-ember/30';

	const SWITCH_TYPE: Record<SwitchType, { label: string; color: string }> = {
		linear: { label: 'Linear', color: 'bg-violet' },
		tactile: { label: 'Tactile', color: 'bg-coral' },
		clicky: { label: 'Clicky', color: 'bg-ember' }
	};

	function delta(cents: number) {
		return cents ? `+${formatPrice(cents)}` : 'inkl.';
	}
</script>

{#snippet section(no: string, title: string, current: string, body: Snippet)}
	<section
		class="rounded-2xl border border-line/60 bg-surface/50 p-4 transition-colors duration-300 hover:border-line"
	>
		<header class="mb-3 flex items-baseline justify-between gap-3">
			<h3 class="font-mono text-[11px] tracking-[0.2em] text-ink-faint uppercase">
				<span class="text-ember">{no}</span> / {title}
			</h3>
			<span class="truncate font-mono text-[11px] text-ink-muted">{current}</span>
		</header>
		{@render body()}
	</section>
{/snippet}

<div class="flex flex-col gap-3">
	{#snippet baseKitBody()}
		<div class="grid grid-cols-2 gap-2">
			{#each baseKits as kit (kit.id)}
				<button
					class={cn(option, 'min-w-0 px-3 py-2.5', builder.baseKitId === kit.id ? active : idle)}
					aria-pressed={builder.baseKitId === kit.id}
					onclick={() => builder.setBaseKit(kit.id)}
				>
					<!-- Silhouette aus den echten Layout-Daten -->
					<LayoutSilhouette
						size={kit.layout}
						class={cn(
							'mb-2 w-full',
							builder.baseKitId === kit.id ? 'text-ember' : 'text-ink-muted'
						)}
					/>
					<span class="flex items-baseline justify-between gap-2">
						<span class="text-sm font-medium text-ink">{kit.name}</span>
						<span class="font-mono text-[10px] text-ink-faint">{kit.layout}</span>
					</span>
					<span class="mt-0.5 block font-mono text-[10px] text-ink-muted">
						{kit.keyCount} Keys · {formatPrice(kit.priceCents)}
					</span>
				</button>
			{/each}
		</div>
		<!-- Beschriftung: gleiche physische Tasten, andere Legenden -->
		<p class="mt-4 mb-1.5 font-mono text-[10px] tracking-[0.15em] text-ink-muted uppercase">
			Beschriftung
		</p>
		<div class="flex gap-2">
			{#each languageOptions as lang (lang.id)}
				<button
					class={cn(option, 'flex-1 px-3 py-2', builder.languageId === lang.id ? active : idle)}
					aria-pressed={builder.languageId === lang.id}
					onclick={() => builder.setLanguage(lang.id)}
				>
					<span class="block text-sm font-medium text-ink">{lang.name}</span>
					<span class="block truncate font-mono text-[10px] text-ink-muted">{lang.hint}</span>
				</button>
			{/each}
		</div>
	{/snippet}
	{@render section(
		'01',
		'Base Kit',
		`${builder.baseKit.name} · ${builder.language.name}`,
		baseKitBody
	)}

	{#snippet caseBody()}
		<div class="flex flex-wrap gap-2.5">
			{#each caseColors as color (color.id)}
				<button
					class={cn(
						'relative h-10 w-10 rounded-full border-2 transition-all duration-300 ease-out hover:scale-110 focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:outline-none',
						builder.caseColorId === color.id
							? 'border-ink shadow-[0_0_16px_oklch(0.72_0.19_45/0.4)]'
							: 'border-line'
					)}
					style:background={color.hex}
					title={`${color.name}${color.priceDeltaCents ? ` (+${formatPrice(color.priceDeltaCents)})` : ''}`}
					aria-label={color.name}
					aria-pressed={builder.caseColorId === color.id}
					onclick={() => builder.setCaseColor(color.id)}
				>
					{#if color.priceDeltaCents}
						<span
							class="absolute -top-1 -right-1 rounded-full bg-void px-1 font-mono text-[8px] text-ink-faint"
						>
							+
						</span>
					{/if}
				</button>
			{/each}
		</div>
		<p class="mt-2 font-mono text-[10px] text-ink-faint">
			{builder.caseColor.name} · {delta(builder.caseColor.priceDeltaCents)}
		</p>
	{/snippet}
	{@render section('02', 'Case', builder.caseColor.name, caseBody)}

	{#snippet switchBody()}
		<div class="grid gap-2">
			{#each switchOptions as sw (sw.id)}
				{@const type = SWITCH_TYPE[sw.type]}
				<button
					class={cn(
						option,
						'flex items-center gap-3 px-3 py-2.5',
						builder.switchId === sw.id ? active : idle
					)}
					aria-pressed={builder.switchId === sw.id}
					onclick={() => builder.setSwitch(sw.id)}
				>
					<span class="w-14 shrink-0 text-line">
						<ForceCurve type={sw.type} class="h-8 w-full" stroke={2.5} />
					</span>
					<span class="flex-1">
						<span class="block text-sm font-medium text-ink">{sw.name}</span>
						<span class="flex items-center gap-1.5 font-mono text-[10px] text-ink-muted">
							<span class={cn('h-1.5 w-1.5 rounded-full', type.color)}></span>
							{type.label} · {sw.actuationForceG}g
						</span>
					</span>
					<span class="font-mono text-[11px] text-ink-muted">
						{formatPrice(sw.pricePerSwitchCents)}<span class="text-ink-faint">/Stk</span>
					</span>
				</button>
			{/each}
		</div>
	{/snippet}
	{@render section('03', 'Switches', builder.switch.name, switchBody)}

	{#snippet keycapBody()}
		<div class="grid grid-cols-2 gap-2">
			{#each keycapSets as set (set.id)}
				<button
					class={cn(
						option,
						'flex items-center gap-3 px-3 py-2.5',
						builder.keycapSetId === set.id ? active : idle
					)}
					aria-pressed={builder.keycapSetId === set.id}
					onclick={() => builder.setKeycapSet(set.id)}
				>
					<span class="flex h-6 w-9 shrink-0 overflow-hidden rounded-sm border border-line">
						<span class="flex-[3]" style:background={set.colors.base}></span>
						<span class="flex-[2]" style:background={set.colors.accent}></span>
						<span class="flex-1" style:background={set.colors.legend}></span>
					</span>
					<span class="min-w-0">
						<span class="block truncate text-sm font-medium text-ink">{set.name}</span>
						<span class="block font-mono text-[10px] text-ink-muted">
							{set.material} · {formatPrice(set.priceCents)}
						</span>
					</span>
				</button>
			{/each}
		</div>
	{/snippet}
	{@render section('04', 'Keycaps', builder.keycapSet.name, keycapBody)}

	{#snippet plateBody()}
		<div class="grid grid-cols-3 gap-2">
			{#each plateOptions as plate (plate.id)}
				<button
					class={cn(option, 'px-3 py-2.5', builder.plateId === plate.id ? active : idle)}
					aria-pressed={builder.plateId === plate.id}
					onclick={() => builder.setPlate(plate.id)}
				>
					<span
						class="mb-2 block h-6 w-full rounded-[4px] border border-ink/10"
						style:background={PLATE_SWATCH[plate.material]}
					></span>
					<span class="block text-sm font-medium text-ink">{plate.name}</span>
					<span class="block font-mono text-[10px] text-ink-muted">
						{delta(plate.priceDeltaCents)}
					</span>
				</button>
			{/each}
		</div>
		<p class="mt-2 font-mono text-[10px] text-ink-faint">{builder.plate.description}</p>
	{/snippet}
	{@render section('05', 'Plate', builder.plate.name, plateBody)}

	{#snippet lightingBody()}
		<div class="grid grid-cols-3 gap-2">
			{#each lightingOptions as light (light.id)}
				<button
					class={cn(option, 'px-3 py-2.5', builder.lightingId === light.id ? active : idle)}
					aria-pressed={builder.lightingId === light.id}
					onclick={() => builder.setLighting(light.id)}
				>
					<!-- Vorschau: ein Streifen "Platte" unter drei Kappen -->
					<span class="mb-2 flex h-6 w-full items-end gap-1 rounded-[4px] bg-void/70 p-1">
						{#each [0, 1, 2] as i (i)}
							<span class="relative h-full flex-1 rounded-[2px] bg-surface-raised">
								<span
									class={cn(
										'absolute inset-x-0 bottom-0 h-[3px] rounded-full',
										light.mode === 'none' && 'bg-line',
										light.mode === 'white' && 'bg-[#fff3d6] shadow-[0_0_6px_#fff3d6]',
										light.mode === 'rgb' &&
											'animate-hue bg-[linear-gradient(90deg,#f43f5e,#f59e0b,#a3e635,#22d3ee,#a855f7,#f43f5e)] shadow-[0_0_6px_#22d3ee]'
									)}
								></span>
							</span>
						{/each}
					</span>
					<span class="text-sm font-medium text-ink">{light.name}</span>
					<span class="block font-mono text-[10px] text-ink-muted">
						{delta(light.priceDeltaCents)}
					</span>
				</button>
			{/each}
		</div>
		<p class="mt-2 font-mono text-[10px] text-ink-faint">{builder.lighting.description}</p>
	{/snippet}
	{@render section('06', 'Lighting', builder.lighting.name, lightingBody)}

	{#snippet connectivityBody()}
		<div class="grid grid-cols-2 gap-2">
			{#each connectivityOptions as conn (conn.id)}
				<button
					class={cn(option, 'px-3 py-2.5', builder.connectivityId === conn.id ? active : idle)}
					aria-pressed={builder.connectivityId === conn.id}
					onclick={() => builder.setConnectivity(conn.id)}
				>
					<span class="flex items-center gap-2 text-sm font-medium text-ink">
						{#if conn.mode === 'wired'}
							<Cable class="size-4 text-ember" />
						{:else}
							<Bluetooth class="size-4 text-violet" />
						{/if}
						{conn.name}
					</span>
					<span class="block font-mono text-[10px] text-ink-muted">
						{conn.mode === 'wired' ? 'USB-C' : 'BT 5.3 · 2.4 GHz'} · {delta(conn.priceDeltaCents)}
					</span>
				</button>
			{/each}
		</div>
		<p class="mt-2 font-mono text-[10px] text-ink-faint">{builder.connectivity.description}</p>
	{/snippet}
	{@render section('07', 'Connectivity', builder.connectivity.name, connectivityBody)}

	{#snippet extrasBody()}
		<p class="mb-1.5 font-mono text-[10px] tracking-[0.15em] text-ink-muted uppercase">
			Novelty-Esc
		</p>
		<div class="grid grid-cols-4 gap-2">
			{#each noveltyOptions as nov (nov.id)}
				<button
					class={cn(
						option,
						'flex flex-col items-center gap-1 px-2 py-2.5',
						builder.noveltyId === nov.id ? active : idle
					)}
					aria-pressed={builder.noveltyId === nov.id}
					title={nov.description}
					onclick={() => builder.setNovelty(nov.id)}
				>
					<!-- Mini-Keycap mit Glyphe – gleiche Symbolschrift wie im 3D-Modell -->
					<span
						class="flex h-8 w-8 items-center justify-center rounded-[4px] border border-line text-base"
						style:background={nov.glyph
							? builder.keycapSet.colors.legend
							: builder.keycapSet.colors.accent}
						style:color={nov.glyph
							? builder.keycapSet.colors.base
							: builder.keycapSet.colors.legend}
					>
						{#if nov.glyph}
							<span class="font-symbols">{nov.glyph}</span>
						{:else}
							<span class="font-mono text-[8px]">Esc</span>
						{/if}
					</span>
					<span class="text-xs font-medium text-ink">{nov.name}</span>
					<span class="font-mono text-[10px] text-ink-muted">{delta(nov.priceDeltaCents)}</span>
				</button>
			{/each}
		</div>
		<p class="mt-2 font-mono text-[10px] text-ink-faint">{builder.novelty.description}</p>

		<p class="mt-4 mb-1.5 font-mono text-[10px] tracking-[0.15em] text-ink-muted uppercase">
			Deskmat
		</p>
		<div class="grid grid-cols-3 gap-2">
			{#each deskmatOptions as mat (mat.id)}
				<button
					class={cn(option, 'px-3 py-2.5', builder.deskmatId === mat.id ? active : idle)}
					aria-pressed={builder.deskmatId === mat.id}
					onclick={() => builder.setDeskmat(mat.id)}
				>
					<span class="flex items-center gap-2">
						{#if mat.style !== 'none'}
							<span
								class="h-3 w-4 rounded-[2px] border"
								style:background={mat.style === 'match' ? builder.keycapSet.colors.base : '#17171b'}
								style:border-color={mat.style === 'match'
									? builder.keycapSet.colors.accent
									: '#2c2c33'}
							></span>
						{/if}
						<span class="text-sm font-medium text-ink">{mat.name}</span>
					</span>
					<span class="block font-mono text-[10px] text-ink-muted"
						>{delta(mat.priceDeltaCents)}</span
					>
				</button>
			{/each}
		</div>
		{#if builder.deskmat.description}
			<p class="mt-2 font-mono text-[10px] text-ink-faint">{builder.deskmat.description}</p>
		{/if}

		<label class="mt-4 block">
			<span class="mb-1.5 flex items-baseline justify-between">
				<span class="font-mono text-[10px] tracking-[0.15em] text-ink-muted uppercase">Gravur</span>
				<span class="font-mono text-[10px] text-ink-faint">
					{builder.engraving.length}/{ENGRAVING_MAX_LENGTH} · {delta(ENGRAVING_PRICE_CENTS)}
				</span>
			</span>
			<input
				type="text"
				maxlength={ENGRAVING_MAX_LENGTH}
				placeholder="z. B. dein Name"
				value={builder.engraving}
				oninput={(e) => builder.setEngraving(sanitizeEngraving(e.currentTarget.value))}
				class="w-full rounded-panel border border-line bg-void/60 px-3 py-2 font-mono text-sm tracking-[0.12em] text-ink uppercase placeholder:tracking-normal placeholder:text-ink-faint placeholder:normal-case focus:border-ember focus:ring-2 focus:ring-ember/30 focus:outline-none"
			/>
		</label>
		<p class="mt-1.5 font-mono text-[10px] text-ink-faint">
			Lasergraviert auf der vorderen Case-Kante. Buchstaben, Ziffern, . - _ ! &
		</p>
	{/snippet}
	{@render section(
		'08',
		'Extras',
		[
			builder.novelty.glyph ? `Esc ${builder.novelty.glyph}` : null,
			builder.deskmat.style !== 'none' ? 'Deskmat' : null,
			builder.engraving ? `"${builder.engraving}"` : null
		]
			.filter(Boolean)
			.join(' · ') || '–',
		extrasBody
	)}
</div>
