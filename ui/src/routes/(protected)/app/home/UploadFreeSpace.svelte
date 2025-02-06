<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Upload, UsersRound } from 'lucide-svelte';
</script>

<div class="flex items-center justify-center gap-6 text-xs p-2">
	<div class="flex flex-col items-center justify-center">
		<Button class="h-8 w-8 rounded-full"><Upload /></Button>
		<div>Upload</div>
	</div>
	<div class="flex flex-col items-center justify-center">
		<Button class="h-8 w-8 rounded-full"><UsersRound /></Button>
		<div>Free Space</div>
	</div>
</div>
