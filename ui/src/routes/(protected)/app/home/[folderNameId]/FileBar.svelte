<script lang="ts">
	import Checkbox from '$lib/components/ui/checkbox/checkbox.svelte';
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import { LayoutGrid, Logs, Share2 } from 'lucide-svelte';
	import type { FoldersReturnType } from '../../../../../hooks.server';
	import { Button } from '$lib/components/ui/button';
	let {
		folder,
		selectedFiles = $bindable(),
		layout = $bindable()
	}: {
		folder: FoldersReturnType;
		selectedFiles: string[];
		layout: 'list' | 'grid';
	} = $props();
	function onCheckedChange(isChecked: boolean) {
		if (!isChecked) {
			selectedFiles = [];
		} else {
			selectedFiles = folder.files.map((file) => file.file_name);
		}
	}
</script>

<div class="flex items-center justify-between p-2 pt-4">
	<div class="flex items-center gap-2 text-xs">
		<Checkbox checked={selectedFiles.length === folder.files.length} {onCheckedChange} />
		{selectedFiles.length} files
	</div>
	<div class="flex h-8 items-center gap-2 text-xs">
		{#if selectedFiles.length > 0}
			<Button
				onclick={(e) => {
					e.preventDefault();
					// download selected files using their download link
					selectedFiles.forEach((file_name) => {
						const file = folder.files.find((file) => file.file_name === file_name);
						// check if navigator share is available
						if (file) {
							if (navigator.share) {
								navigator.share({
									title: file.file_name,
									url: file.download_url
								});
							} else {
								// const link = document.createElement('a');
								// link.href = file.download_url;
								// link.download = file.file_name;
								// link.click();
								window.open(file.download_url, '_blank');
							}
						}
					});
				}}
				class="flex aspect-square items-center justify-center rounded-full p-1"
			>
				<Share2 size={0.1} />
			</Button>
		{/if}
		<Tabs.Root bind:value={layout}>
			<Tabs.List class="h-7 bg-gray-50">
				<Tabs.Trigger value="list" class="w-6 px-1"><Logs size="" /></Tabs.Trigger>
				<Tabs.Trigger value="grid" class="w-6 px-1"><LayoutGrid size="" /></Tabs.Trigger>
			</Tabs.List>
		</Tabs.Root>
	</div>
</div>
