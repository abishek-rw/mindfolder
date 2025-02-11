<script lang="ts">
	import {
		type ApiResponse,
		type FileListResponse,
		type FileContentResponse,
		type File,
		type Folder,
		isGroupedResponse
	} from '$lib/stores/app.svelte';

	let KVpair: { req: string; resp: ApiResponse } = $props();

	// Type guard to check if the response is a FileListResponse
	function isFileListResponse(response: ApiResponse): response is FileListResponse {
		if (!response) return false;
		return 'folder_name' in response;
	}

	// Type guard to check if the response is a FileContentResponse
	function isFileContentResponse(response: ApiResponse): response is FileContentResponse {
		if (!response) return false;
		return 'cluster_id' in response;
	}

	// Recursive function to render folders and files
	function renderItem(item: File | Folder) {
		if ('items' in item) {
			// It's a Folder
			return folderRenderer(item);
		} else if ('file_name' in item) {
			// It's a File
			return fileRenderer(item);
		} else {
			item;
		}
	}
</script>

{#snippet fileRenderer(file: File)}
	<div class="file">
		<span>{file.file_name}</span>
		<span>({file.file_type})</span>
		<span>{file.file_date}</span>
	</div>
{/snippet}

{#snippet folderRenderer(folder: Folder)}
	<div class="folder">
		<h3>{folder.name}</h3>
		{#each folder.items as item}
			{renderItem(item)}
		{/each}
	</div>
{/snippet}

{#if isFileContentResponse(KVpair.resp)}
	<div class="file-content">
		{KVpair.resp.response}
	</div>
{:else if isFileListResponse(KVpair.resp)}
	<div class="file-list">
		{#if isGroupedResponse(KVpair.resp.response)}
			{#each Object.entries(KVpair.resp.response) as [year, files]}
				<div class="year-group">
					<h2>{year}</h2>
					{#each files as file}
						{renderItem(file)}
					{/each}
				</div>
			{/each}
		{:else}
			{#each KVpair.resp.response as file}
				{renderItem(file)}
			{/each}
		{/if}
	</div>
{/if}
