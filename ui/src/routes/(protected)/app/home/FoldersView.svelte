<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import { getAppState } from '$lib/stores/app.svelte';
	import { ScrollArea } from '$lib/components/ui/scroll-area';

	const AppState = getAppState();
</script>

<div class="flex min-h-0 w-full grow items-center justify-center">
	{#if AppState.folders.length === 0}
		No files have been uploaded
	{:else}
		<!-- 3column grid -->
		<ScrollArea orientation="vertical" class="h-full w-full rounded-lg">
			<div class="grid h-full w-full grid-cols-3 gap-2 bg-gray-200 p-2 shadow-inner">
				{#each AppState.folders as folder}
					<Button
						class="relative col-span-1 h-20 rounded-lg bg-gray-100 p-2 shadow-lg"
						onclick={() => goto(`/app/home/${folder.folderName}`)}
						variant="outline"
					>
						<div class="w-full overflow-clip text-ellipsis pb-2 text-xs font-bold capitalize">
							{folder.folderName}
						</div>
						<div class="absolute bottom-2 left-2 text-xs text-gray-500">{folder.files.length}</div>
					</Button>
				{/each}
			</div>
		</ScrollArea>
	{/if}
</div>
