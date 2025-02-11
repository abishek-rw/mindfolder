<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import ChevronLeft from 'lucide-svelte/icons/chevron-left';
</script>

<Button
	class="absolute left-2 top-2 h-8 w-8 rounded-full shadow-lg"
	variant="outline"
	onclick={(e) => window.history.back()}
>
	<ChevronLeft />
</Button>
