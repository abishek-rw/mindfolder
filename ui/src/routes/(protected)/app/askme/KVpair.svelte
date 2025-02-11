<script lang="ts">
	import {
		type ApiResponse,
		type FileListResponse,
		type FileContentResponse,
		type File,
		type Folder,
		isGroupedResponse,
		type ApiInput
	} from '$lib/stores/app.svelte';

	let { KVpair }: { KVpair: { req: ApiInput; resp: ApiResponse } } = $props();
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
			<div class="rounded-md bg-white p-2">
				{#each resp as file}
					<div class="w-full break-words rounded-md bg-gray-100">
						<div>
							{file.file_name}
						</div>
						<div class="w-full pl-1">
							{@render respRender(file.file_content)}
						</div>
					</div>
				{/each}
			</div>
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
		<div class="bg-primary mt-[0.3rem] h-6 w-6 shrink-0 rounded-full shadow-lg flex items-center justify-center">
			<div class="bg-white rounded-full shrink-0 h-3 w-3 shadow-sm border"></div>
		</div>
		<span class="min-w-0 break-words rounded-md bg-white p-2 text-xs shadow-inner"
			>{@render respRender(KVpair.resp.response)}</span
		>
	</div>
</div>
