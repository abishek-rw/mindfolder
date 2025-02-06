<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import { getAppState } from '$lib/stores/app.svelte';

	const AppState = getAppState();
</script>

<div class="flex w-full grow items-center justify-center">
	{#if AppState.folders.length === 0}
		No files have been uploaded
	{:else}
		<!-- 3column grid -->
		<div class="grid h-full w-full grid-cols-3 gap-2 p-2">
			{#each AppState.folders as folder}
				<Button
					class="relative col-span-1 h-20 rounded-lg bg-gray-100 p-2"
					onclick={() => goto(`/app/home/${folder.folderId}`)}
                    variant="outline"
				>
					<div class=" pb-2 font-bold capitalize">{folder.folderName}</div>
					<div class="absolute bottom-2 left-2 text-xs text-gray-500">{folder.files.length}</div>
				</Button>
			{/each}
		</div>
	{/if}
</div>
