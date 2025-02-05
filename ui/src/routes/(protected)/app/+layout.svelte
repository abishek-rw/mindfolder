<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import { getAppState, setAppState } from '$lib/stores/app.svelte';
	import Textbar from './Textbar.svelte';

	let { children } = $props();
	setAppState();
	const AppState = getAppState();
</script>

<div class="flex h-full w-full flex-col">
	<main class="w-full grow p-2">
		{@render children()}
	</main>
	<div class="w-full flex flex-col">
        <Textbar />
		<div class="flex h-12">
			<Button
				class={`flex h-full w-0 grow items-center justify-center ${AppState.appPage === 'home' ? '' : 'opacity-55'}`}
				variant="ghost"
				onclick={() => {
					if (AppState.appPage !== 'home') {
						goto('/app/home');
					}
				}}
			>
				Home
			</Button>
			<Button
				class={`flex h-full w-0 grow items-center justify-center ${AppState.appPage === 'askme' ? '' : 'opacity-55'}`}
				variant="ghost"
				onclick={() => {
					if (AppState.appPage !== 'askme') {
						goto('/app/askme');
					}
				}}
			>
				Ask Me
			</Button>
			<Button
				class={`flex h-full w-0 grow items-center justify-center ${AppState.appPage === 'profile' ? '' : 'opacity-55'}`}
				variant="ghost"
			>
				Profile
			</Button>
		</div>
	</div>
</div>
