<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Separator } from '$lib/components/ui/separator';
	import {
		type ApiResponse,
		type FileListResponse,
		type FileContentResponse,
		type File,
		type Folder,
		isGroupedResponse,
		type ApiInput,
		getAppState
	} from '$lib/stores/app.svelte';
	import { Share2 } from 'lucide-svelte';

	let { KVpair }: { KVpair: { req: ApiInput; resp: ApiResponse } } = $props();

	const AppState = getAppState();
</script>

{#snippet respRender(
	resp:
		| string
		| any[]
		| {
				[key: string]: any;
		  }
)}
	{#if typeof resp === 'string'}
		{resp}
	{:else if Array.isArray(resp)}
		{#if resp.length === 0}
			No files found
		{:else}
			<div class="flex flex-col gap-1 rounded-md bg-white p-2">
				{#each resp as file}
					<div class="w-full break-words rounded-md bg-gray-100 p-1">
						<div>
							{file.file_name}
						</div>
						<div class="w-full">
							{@render respRender(file.file_content)}
						</div>
					</div>
				{/each}
			</div>
			<Button
				onclick={(e) => {
					e.preventDefault();
					let filteredFiles = AppState.files.filter((file) => file.file_name === resp[0].file_name);
					if (filteredFiles.length > 0) {
						filteredFiles.forEach((file) => {
							if (navigator.share) {
								navigator.share({
									title: file.file_name,
									url: file.download_url
								});
							} else {
								window.open(file.download_url, '_blank');
							}
						});
					}
				}}
				class="absolute bottom-0 right-2 flex aspect-square h-6 w-6 translate-y-1/2 items-center justify-center rounded-full p-0"
			>
				<Share2 size={1} />
			</Button>
		{/if}
	{:else if typeof resp === 'object'}
		{#if Object.keys(resp).length === 0}
			No files found
		{:else}
			<div class="w-full break-words rounded-md bg-gray-100">
				{#each Object.entries(resp) as [key, value]}
					<div class="flex w-full flex-col justify-center break-words p-2">
						<div>
							{key}
						</div>
						<Separator orientation="horizontal" />
						<div class="w-full">
							{@render respRender(value)}
						</div>
					</div>
				{/each}
			</div>
		{/if}
	{:else}
		{JSON.stringify(resp)}
	{/if}
{/snippet}

<div class="flex w-full flex-col gap-2 p-2">
	<!-- user -->
	<div class="req flex w-full items-center justify-end">
		<span class=" rounded-md bg-white p-2 text-xs shadow-sm">{KVpair.req.user_prompt}</span>
	</div>
	<div class="resp flex w-full items-start justify-start gap-2">
		<div
			class="bg-primary mt-[0.3rem] flex h-6 w-6 shrink-0 items-center justify-center rounded-full shadow-lg"
		>
			<div class="h-3 w-3 shrink-0 rounded-full border bg-white shadow-sm"></div>
		</div>
		<div class="relative min-w-0 break-words rounded-md bg-white p-2 text-xs shadow-inner">
			{@render respRender(KVpair.resp.response)}
		</div>
	</div>
</div>
