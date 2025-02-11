<script lang="ts">
	import { getAppState } from '$lib/stores/app.svelte';
	import KVpair from './KVpair.svelte';

	const AppState = getAppState();
</script>

<svelte:head>
	<title>Ask Me</title>
</svelte:head>
Ask Me
<div class="flex w-full grow flex-col gap-4 p-2">
	{#each AppState.KVs as { req, resp }, i}
		<KVpair KVpair={{ req, resp }} />
	{/each}
</div>
