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
	<main class="w-full grow p-2 flex flex-col">
		{@render children()}
	</main>
	<div class="flex w-full flex-col">
		<Textbar />
		<div class="flex h-16">
			<Button
				class={`flex h-full w-0 grow flex-col items-center justify-center gap-0 pt-4 ${AppState.appPage === 'home' ? 'text-primary hover:text-primary' : 'opacity-55'}`}
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
				class={`flex h-full w-0 grow flex-col items-center justify-center gap-0 pt-4 ${AppState.appPage === 'askme' ? 'text-primary hover:text-primary' : 'opacity-55'}`}
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
				class={`flex h-full w-0 grow flex-col items-center justify-center gap-0 pt-4 ${AppState.appPage === 'profile' ? 'text-primary hover:text-primary' : 'opacity-55'}`}
				variant="ghost"
			>
				<User />
				Profile
			</Button>
		</div>
	</div>
</div>
