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
		knobOptions,
		ENGRAVING_MAX_LENGTH,
		ENGRAVING_PRICE_CENTS,
		type SwitchType
	} from '$lib/data/catalog';
	import { sanitizeEngraving } from '$lib/pricing';
	import { cn } from '$lib/utils';

	const option =
		'group rounded-panel border text-left transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/60';
	const idle = 'border-line bg-surface/70 hover:border-steel hover:bg-surface-raised';
	const active = 'border-neon bg-neon-soft shadow-glow';

	const SWITCH_TYPE: Record<SwitchType, { label: string; color: string }> = {
		linear: { label: 'Linear', color: 'bg-neon' },
		tactile: { label: 'Tactile', color: 'bg-brass' },
		clicky: { label: 'Clicky', color: 'bg-ember' }
	};

	function delta(cents: number) {
		return cents ? `+${formatPrice(cents)}` : 'inkl.';
	}
</script>

{#snippet section(no: string, title: string, current: string, body: Snippet)}
	<section class="border-t border-line/70 pt-5 first:border-t-0 first:pt-0">
		<header class="mb-3 flex items-baseline justify-between gap-3">
			<h3 class="font-mono text-[11px] tracking-[0.2em] text-ink-faint uppercase">
				<span class="text-neon/80">{no}</span> / {title}
			</h3>
			<span class="truncate font-mono text-[11px] text-ink-muted">{current}</span>
		</header>
		{@render body()}
	</section>
{/snippet}

<div class="flex flex-col gap-5">
	{#snippet baseKitBody()}
		<div class="grid grid-cols-2 gap-2">
			{#each baseKits as kit (kit.id)}
				<button
					class={cn(option, 'px-3 py-2.5', builder.baseKitId === kit.id ? active : idle)}
					aria-pressed={builder.baseKitId === kit.id}
					onclick={() => builder.setBaseKit(kit.id)}
				>
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
		<div class="mt-2 flex gap-2">
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
						'relative h-10 w-10 rounded-full border-2 transition-transform hover:scale-110 focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:outline-none',
						builder.caseColorId === color.id ? 'border-neon shadow-glow' : 'border-line'
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
					<span class={cn('h-2 w-2 shrink-0 rounded-full', type.color)}></span>
					<span class="flex-1">
						<span class="block text-sm font-medium text-ink">{sw.name}</span>
						<span class="block font-mono text-[10px] text-ink-muted">
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
					<span class="flex items-center gap-2">
						<span
							class={cn(
								'h-2 w-2 rounded-full',
								light.mode === 'none' && 'border border-line',
								light.mode === 'white' && 'bg-[#fff3d6] shadow-[0_0_8px_#fff3d6]',
								light.mode === 'rgb' &&
									'bg-[linear-gradient(90deg,#f43f5e,#a3e635,#22d3ee,#a855f7)] shadow-glow'
							)}
						></span>
						<span class="text-sm font-medium text-ink">{light.name}</span>
					</span>
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
					<span class="block text-sm font-medium text-ink">{conn.name}</span>
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
		<div class="grid grid-cols-2 gap-2">
			{#each knobOptions as knob (knob.id)}
				<button
					class={cn(option, 'px-3 py-2.5', builder.knobId === knob.id ? active : idle)}
					aria-pressed={builder.knobId === knob.id}
					onclick={() => builder.setKnob(knob.id)}
				>
					<span class="block text-sm font-medium text-ink">{knob.name}</span>
					<span class="block font-mono text-[10px] text-ink-muted"
						>{delta(knob.priceDeltaCents)}</span
					>
				</button>
			{/each}
		</div>
		<p class="mt-2 font-mono text-[10px] text-ink-faint">{builder.knob.description}</p>

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
				class="w-full rounded-panel border border-line bg-void/60 px-3 py-2 font-mono text-sm tracking-[0.12em] text-ink uppercase placeholder:tracking-normal placeholder:text-ink-faint placeholder:normal-case focus:border-neon focus:ring-2 focus:ring-ring/40 focus:outline-none"
			/>
		</label>
		<p class="mt-1.5 font-mono text-[10px] text-ink-faint">
			Lasergraviert auf der vorderen Case-Kante. Buchstaben, Ziffern, . - _ ! &
		</p>
	{/snippet}
	{@render section(
		'08',
		'Extras',
		[builder.knob.enabled ? 'Knob' : null, builder.engraving ? `"${builder.engraving}"` : null]
			.filter(Boolean)
			.join(' · ') || '–',
		extrasBody
	)}
</div>
