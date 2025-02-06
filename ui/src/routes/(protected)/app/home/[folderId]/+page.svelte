<script lang="ts">
	import { getAppState } from '$lib/stores/app.svelte';
	import Back from '../../../../(anti-protected)/Back.svelte';

	let { data } = $props();
    const AppState = getAppState();
    let files = $state(AppState.folders.find((folder) => folder.folderId === data.folderId)?.files ?? []);
</script>

<svelte:head>
	<title>Home | {data.folderId}</title>
</svelte:head>

<div class="relative w-full flex items-center pt-3 capitalize pl-16">
	<Back />
	{data.folderId}
</div>
