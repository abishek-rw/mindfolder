<script lang="ts">
	import { getAppState } from '$lib/stores/app.svelte';
	import KVpair from './KVpair.svelte';
	import { ScrollArea } from '$lib/components/ui/scroll-area';

	const AppState = getAppState();
</script>

<svelte:head>
	<title>Ask Me</title>
</svelte:head>
<div class="relative flex w-full items-center p-2 pt-3 capitalize">Ask Me</div>
<div class="flex w-full min-h-0 grow flex-col gap-4 p-2">
	{#if AppState.KVs.length === 0}
		<div
			class="flex h-full min-h-0 w-full grow items-center justify-center text-center text-gray-500"
		>
			No questions have been asked. Let's start by asking one below.
		</div>
	{:else}
		<ScrollArea orientation="vertical" class="h-full min-h-0 grow">
			{#each AppState.KVs as { req, resp }, i}
				<KVpair KVpair={{ req, resp }} />
			{/each}
		</ScrollArea>
	{/if}
</div>
