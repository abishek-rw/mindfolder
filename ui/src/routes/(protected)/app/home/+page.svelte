<script>
	import { getAppState } from '$lib/stores/app.svelte';
	import FoldersView from './FoldersView.svelte';
	import Progress from './Progress.svelte';
	import UploadFreeSpace from './UploadFreeSpace.svelte';
	let { data } = $props();
	$inspect(data);
	const AppData = getAppState();
	AppData.folders = data.folders;
</script>

<svelte:head>
	<title>Home</title>
</svelte:head>

<div class="relative flex w-full items-center p-2 pt-3 capitalize">Home</div>
<Progress mb={data.mbUsed ?? 0} />
<UploadFreeSpace />
<FoldersView />
