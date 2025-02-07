<script lang="ts">
	import Checkbox from '$lib/components/ui/checkbox/checkbox.svelte';
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import { LayoutGrid, Logs } from 'lucide-svelte';
	import type { FoldersReturnType } from '../../../../../hooks.server';
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
	<Tabs.Root bind:value={layout}>
		<Tabs.List class="h-7">
			<Tabs.Trigger value="list" class="w-6 px-1"><Logs size="" /></Tabs.Trigger>
			<Tabs.Trigger value="grid" class="w-6 px-1"><LayoutGrid size="" /></Tabs.Trigger>
		</Tabs.List>
	</Tabs.Root>
</div>
