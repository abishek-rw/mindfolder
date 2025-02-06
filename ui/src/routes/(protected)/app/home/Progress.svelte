<script lang="ts">
	import { Progress } from '$lib/components/ui/progress/index.js';

	let value = $state(13);
</script>

<div class="w-full flex flex-col gap-2">
	<div class="w-full flex items-end justify-evenly">
		<!-- svelte-ignore element_invalid_self_closing_tag -->
		<div class="bg-primary w-[2px] h-2"/>
		<!-- svelte-ignore element_invalid_self_closing_tag -->
		<div class="bg-primary w-[3px] h-4"/>
		<!-- svelte-ignore element_invalid_self_closing_tag -->
		<div class="bg-primary w-[2px] h-2"/>
	</div>
	<Progress {value} max={100} class="w-full" />
	<div class="flex items-center justify-between text-xs">
		<div>
			0MB
		</div>
		<div>
			100MB
		</div>
	</div>
</div>
