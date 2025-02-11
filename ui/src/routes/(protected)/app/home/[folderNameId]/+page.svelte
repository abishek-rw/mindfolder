<script lang="ts">
	import Checkbox from '$lib/components/ui/checkbox/checkbox.svelte';
	import Back from '../../../../(anti-protected)/Back.svelte';
	import FileBar from './FileBar.svelte';
	import FileFolderHints from './FileFolderHints.svelte';
	import { ScrollArea } from '$lib/components/ui/scroll-area';

	let { data } = $props();
	let selectedFiles: string[] = $state([]);
	let layout: 'list' | 'grid' = $state('list');
</script>

<svelte:head>
	<title>Home | {data.folder.folderName}</title>
</svelte:head>

<div class="relative flex w-full items-center pl-16 pt-3 capitalize">
	<Back />
	{data.folder.folderName}
</div>
<FileBar folder={data.folder} bind:selectedFiles={selectedFiles} bind:layout={layout} />
<ScrollArea orientation="vertical" class="grow min-h-0 h-full bg-gray-200 rounded-lg shadow-inner flex flex-col gap-2 overflow-y-auto">
<div class="w-full flex flex-col gap-2 p-2">
	{#each data.folder.files as file}
		<div class="flex items-center justify-center gap-2 p-2 rounded-lg shadow-lg bg-white">
			<Checkbox
				onCheckedChange={(val) => {
					if (val) {
						selectedFiles = [...selectedFiles, file.file_name];
					} else {
						selectedFiles = selectedFiles.filter((file_name) => file_name !== file.file_name);
					}
				}}
				checked = {selectedFiles.includes(file.file_name)}
			/>
			<div class="flex grow items-center justify-center gap-2">
				<div class="flex grow flex-col justify-center">
					<div>
						{file.file_name}
					</div>
					<div class="flex text-xs">
						{file.upload_date}
						{file.upload_time}
					</div>
				</div>
			</div>
		</div>
	{/each}
</div>
</ScrollArea>
<FileFolderHints />
