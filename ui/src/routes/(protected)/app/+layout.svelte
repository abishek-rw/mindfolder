<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import { getAppState, setAppState } from '$lib/stores/app.svelte';
	import { House, MessageSquareText, User } from 'lucide-svelte';
	import Textbar from './Textbar.svelte';

	let { children } = $props();
	setAppState();
	const AppState = getAppState();
</script>

<div class="flex h-full w-full flex-col">
	<main class="flex w-full grow min-h-0 flex-col p-2">
		{@render children()}
	</main>
	<div class="flex w-full flex-col gap-2">
		<Textbar />
		<div class="shadow-inner flex h-16">
			<Button
				class={`flex h-full w-0 grow min-h-0 rounded-none flex-col items-center justify-center gap-0 pt-4 ${AppState.appPage === 'home' ? 'text-primary hover:text-primary' : 'opacity-55'}`}
				variant="ghost"
				onclick={() => {
					if (AppState.appPage !== 'home') {
						goto('/app/home');
					}
				}}
			>
				<House />
				Home
			</Button>
			<Button
				class={`flex h-full w-0 grow rounded-none flex-col items-center justify-center gap-0 pt-4 ${AppState.appPage === 'askme' ? 'text-primary hover:text-primary' : 'opacity-55'}`}
				variant="ghost"
				onclick={() => {
					if (AppState.appPage !== 'askme') {
						goto('/app/askme');
					}
				}}
			>
				<MessageSquareText />
				Ask Me
			</Button>
			<Button
				class={`flex h-full w-0 grow rounded-none flex-col items-center justify-center gap-0 pt-4 ${AppState.appPage === 'profile' ? 'text-primary hover:text-primary' : 'opacity-55'}`}
				variant="ghost"
			>
				<User />
				Profile
			</Button>
		</div>
	</div>
</div>

<style>
	/* .card {
		box-shadow:
			rgba(50, 50, 93, 0.25) 0px 30px 50px -12px inset,
			rgba(0, 0, 0, 0.3) 0px 18px 26px -18px inset;
	} */
</style>
