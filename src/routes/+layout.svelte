<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import Atmosphere from '$lib/components/ui/Atmosphere.svelte';
	import { page } from '$app/state';

	let { children } = $props();
	// Absolute URL fürs Teilen – Slack/LinkedIn/WhatsApp brauchen sie so
	const ogImage = $derived(`${page.url.origin}/og.jpg`);
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<meta property="og:site_name" content="SwitchForge" />
	<meta property="og:type" content="website" />
	<meta property="og:image" content={ogImage} />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:image" content={ogImage} />
	<meta name="theme-color" content="#0b0b0f" />
</svelte:head>
<Atmosphere />
{@render children()}
