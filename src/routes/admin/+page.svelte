<script lang="ts">
	import { enhance } from '$app/forms';
	import SiteHeader from '$lib/components/ui/SiteHeader.svelte';
	import { formatPrice } from '$lib/pricing';
	import { cn } from '$lib/utils';
	import ExternalLink from '@lucide/svelte/icons/external-link';

	let { data, form } = $props();

	const STATUS_TONE: Record<string, string> = {
		paid: 'bg-violet/20 text-violet',
		building: 'bg-ember/20 text-ember',
		shipped: 'bg-neon/20 text-neon',
		delivered: 'bg-acid/20 text-acid',
		cancelled: 'bg-danger/20 text-danger'
	};

	const date = (iso: string) =>
		new Date(iso).toLocaleString('de-DE', {
			day: '2-digit',
			month: '2-digit',
			year: '2-digit',
			hour: '2-digit',
			minute: '2-digit'
		});

	const input =
		'w-full rounded-panel border border-line bg-void/60 px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:border-ember focus:outline-none';
</script>

<svelte:head>
	<title>Admin – SwitchForge</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<SiteHeader compact />

<main class="mx-auto max-w-5xl px-6 py-12">
	{#if !data.enabled}
		<h1 class="font-display text-2xl font-extrabold text-ink">Admin nicht aktiviert</h1>
		<p class="mt-2 max-w-md text-sm text-ink-muted">
			Dafür müssen <code class="font-mono text-ink">DATABASE_URL</code> und
			<code class="font-mono text-ink">ADMIN_PASSWORD</code> gesetzt sein.
		</p>
	{:else if !data.authed}
		<form method="POST" action="?/login" use:enhance class="max-w-sm">
			<p class="font-mono text-[11px] tracking-[0.25em] text-ember uppercase">Admin</p>
			<h1 class="mt-2 font-display text-2xl font-extrabold text-ink">Anmelden</h1>
			<input
				type="password"
				name="password"
				placeholder="Passwort"
				autocomplete="current-password"
				class={cn(input, 'mt-6')}
			/>
			{#if form?.message}
				<p class="mt-2 font-mono text-[11px] text-danger">{form.message}</p>
			{/if}
			<button
				class="mt-4 inline-flex h-10 items-center rounded-full bg-brand px-5 text-sm font-semibold text-void"
			>
				Anmelden
			</button>
		</form>
	{:else}
		<div class="flex flex-wrap items-end justify-between gap-4">
			<div>
				<p class="font-mono text-[11px] tracking-[0.25em] text-ember uppercase">Admin</p>
				<h1 class="mt-2 font-display text-2xl font-extrabold text-ink">
					Bestellungen <span class="text-ink-muted">({data.orders.length})</span>
				</h1>
			</div>
			<form method="POST" action="?/logout" use:enhance>
				<button
					class="font-mono text-[11px] tracking-[0.15em] text-ink-muted uppercase hover:text-ink"
				>
					Abmelden
				</button>
			</form>
		</div>

		{#if data.orders.length === 0}
			<p class="mt-10 text-sm text-ink-muted">
				Noch keine Bestellungen. Sobald der Webhook eine anlegt, steht sie hier.
			</p>
		{/if}

		<div class="mt-8 flex flex-col gap-4">
			{#each data.orders as o (o.id)}
				<details
					class="group rounded-2xl border border-line bg-surface/50"
					open={form?.updated === o.id}
				>
					<summary
						class="flex cursor-pointer flex-wrap items-center gap-x-4 gap-y-2 px-5 py-4 [&::-webkit-details-marker]:hidden"
					>
						<span class="font-mono text-sm font-medium text-ink">{o.id}</span>
						<span
							class={cn(
								'rounded-full px-2 py-0.5 font-mono text-[10px] tracking-[0.15em] uppercase',
								STATUS_TONE[o.status]
							)}
						>
							{data.statuses.find((s) => s.id === o.status)?.label}
						</span>
						<span class="text-sm text-ink-muted">{o.customerName ?? '–'} · {o.email ?? '–'}</span>
						<span class="ml-auto font-mono text-sm text-ink">{formatPrice(o.amountCents)}</span>
						<span class="font-mono text-[10px] text-ink-faint">{date(o.createdAt)}</span>
					</summary>

					<div class="grid gap-6 border-t border-line/70 px-5 py-5 md:grid-cols-[1fr_1fr]">
						<div>
							<p class="font-mono text-[10px] tracking-[0.2em] text-ink-faint uppercase">
								Positionen
							</p>
							<ul class="mt-2 space-y-1 text-sm text-ink-muted">
								{#each o.items as item, i (i)}
									<li>
										{item.qty}× {item.label}{#if item.engraving}
											· Gravur „{item.engraving}“{/if}
									</li>
								{/each}
							</ul>
							{#if o.shipping}
								<p class="mt-4 font-mono text-[10px] tracking-[0.2em] text-ink-faint uppercase">
									Lieferadresse
								</p>
								<p class="mt-2 text-sm text-ink-muted">
									{o.shipping.name}<br />{o.shipping.line1}{#if o.shipping.line2}<br />{o.shipping
											.line2}{/if}<br />
									{o.shipping.postalCode}
									{o.shipping.city}, {o.shipping.country}
								</p>
							{/if}
							<a
								href={`/orders/${o.id}?t=${o.accessToken}`}
								target="_blank"
								rel="noopener"
								class="mt-4 inline-flex items-center gap-1 font-mono text-[11px] text-ember hover:underline"
							>
								Kundenansicht <ExternalLink class="size-3" />
							</a>
						</div>

						<form method="POST" action="?/update" use:enhance class="flex flex-col gap-3">
							<input type="hidden" name="id" value={o.id} />
							<label class="block">
								<span class="font-mono text-[10px] tracking-[0.2em] text-ink-faint uppercase"
									>Status</span
								>
								<select name="status" class={cn(input, 'mt-1')} value={o.status}>
									{#each data.statuses as s (s.id)}
										<option value={s.id}>{s.label}</option>
									{/each}
								</select>
							</label>
							<div class="grid grid-cols-2 gap-3">
								<label class="block">
									<span class="font-mono text-[10px] tracking-[0.2em] text-ink-faint uppercase"
										>Sendungsnr.</span
									>
									<input
										name="trackingNumber"
										value={o.trackingNumber ?? ''}
										class={cn(input, 'mt-1')}
									/>
								</label>
								<label class="block">
									<span class="font-mono text-[10px] tracking-[0.2em] text-ink-faint uppercase"
										>Tracking-URL</span
									>
									<input name="trackingUrl" value={o.trackingUrl ?? ''} class={cn(input, 'mt-1')} />
								</label>
							</div>
							<label class="block">
								<span class="font-mono text-[10px] tracking-[0.2em] text-ink-faint uppercase"
									>Notiz (intern)</span
								>
								<input name="note" value={o.note ?? ''} class={cn(input, 'mt-1')} />
							</label>
							<div class="flex items-center gap-3">
								<button
									class="inline-flex h-9 items-center rounded-full bg-brand px-4 text-sm font-semibold text-void"
								>
									Speichern
								</button>
								<span class="font-mono text-[10px] text-ink-faint"
									>Statuswechsel löst eine Mail an den Kunden aus.</span
								>
							</div>
						</form>
					</div>
				</details>
			{/each}
		</div>
	{/if}
</main>
