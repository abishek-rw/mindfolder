<script lang="ts">
	import { ScrollArea } from '$lib/components/ui/scroll-area';
	import { getAppState } from '$lib/stores/app.svelte';
	const AppState = getAppState();
</script>

{#snippet FileFolderHint(text: string)}
	<button onclick={()=>{
		AppState.prompt = text
		AppState.sendPrompt()
	}} class="flex w-40 shadow-lg overflow-visible flex-shrink-0 items-center rounded-xl bg-white p-4 text-center text-xs">
		{text}
	</button>
{/snippet}

<div class="w-full px-2">
	<ScrollArea orientation="horizontal">
		<div class="flex gap-2 overflow-x-auto py-2">
			{@render FileFolderHint('Files uploaded in the last 5 days')}
			{@render FileFolderHint('Images downloaded in the last month')}
			{@render FileFolderHint('Certificates received in the previous week')}
			{@render FileFolderHint('Tasks completed today')}
		</div>
	</ScrollArea>
</div>
