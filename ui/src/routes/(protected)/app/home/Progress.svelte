<script lang="ts">
	import { Progress } from '$lib/components/ui/progress/index.js';
	let { mb }: { mb: number } = $props();
</script>

<div class="flex w-full flex-col gap-2">
	<div class="flex w-full items-end justify-evenly">
		<!-- svelte-ignore element_invalid_self_closing_tag -->
		<div class="bg-primary h-2 w-[2px]" />
		<!-- svelte-ignore element_invalid_self_closing_tag -->
		<div class="bg-primary h-4 w-[3px]" />
		<!-- svelte-ignore element_invalid_self_closing_tag -->
		<div class="bg-primary h-2 w-[2px]" />
	</div>
	<Progress value={mb} max={100} class="w-full shadow-lg" />
	<div class="flex items-center justify-between text-xs">
		<div>0MB</div>
		<div>100MB</div>
	</div>
</div>
