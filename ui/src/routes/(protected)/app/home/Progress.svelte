<script lang="ts">
	import { onMount } from 'svelte';
	import { Progress } from '$lib/components/ui/progress/index.js';

	let value = $state(13);
</script>

<div class="w-full flex flex-col gap-2">
	<div class="w-full flex items-end justify-evenly">
		<div class="bg-primary w-[2px] h-2"/>
		<div class="bg-primary w-[3px] h-4"/>
		<div class="bg-primary w-[2px] h-2"/>
	</div>
	<Progress {value} max={100} class="w-full" />
</div>
