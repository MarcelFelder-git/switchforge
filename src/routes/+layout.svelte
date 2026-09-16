<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import Atmosphere from '$lib/components/ui/Atmosphere.svelte';

	let { children } = $props();
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
<Atmosphere />
{@render children()}
