<script lang="ts">
	import { goto } from '$app/navigation';
	import { Toaster } from '$lib/components/ui/sonner';
	import { toast } from 'svelte-sonner';
	import '../app.css';
	import { page } from '$app/state';
	import { browser } from '$app/environment';
	let { children } = $props();

	$effect(() => {
		if (page.url.searchParams.has('error')) {
			if (browser) {
				requestAnimationFrame(() => {
					toast.error(page.url.searchParams.get('error')!);
					goto(page.url.pathname);
				});
			}
		}
	});
</script>

<Toaster />
<div class="mx-auto flex h-[100dvh] w-full max-w-sm flex-col font-manrope border">
	{@render children()}
</div>
