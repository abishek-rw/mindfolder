<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import { getAppState, setAppState } from '$lib/stores/app.svelte';
	import { House, MessageSquareText, User } from 'lucide-svelte';
	import Textbar from './Textbar.svelte';
	import * as Drawer from '$lib/components/ui/drawer/index.js';
	import ProfileDrawer from './ProfileDrawer.svelte';

	let { children } = $props();
	setAppState();
	const AppState = getAppState();
	let isDrawerOpen = $state(false);
</script>

<div class="flex h-full w-full flex-col">
	<main class="flex min-h-0 w-full grow flex-col p-2">
		{@render children()}
	</main>
	<div class="flex w-full flex-col gap-2">
		<Textbar />
		<div class="flex h-16 shadow-inner">
			<Button
				class={`flex h-full min-h-0 w-0 grow flex-col items-center justify-center gap-0 rounded-none pt-4 ${AppState.appPage === 'home' ? 'text-primary hover:text-primary' : 'opacity-55'}`}
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
				class={`flex h-full w-0 grow flex-col items-center justify-center gap-0 rounded-none pt-4 ${AppState.appPage === 'askme' ? 'text-primary hover:text-primary' : 'opacity-55'}`}
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

			<ProfileDrawer bind:open={isDrawerOpen}>
				{#snippet trigger(triggerprops)}
					<Button
						{...triggerprops}
						class={`flex h-full w-0 grow flex-col items-center justify-center gap-0 rounded-none pt-4 ${AppState.appPage === 'profile' ? 'text-primary hover:text-primary' : 'opacity-55'}`}
						variant="ghost"
					>
						<User />
						Profile
					</Button>
				{/snippet}
			</ProfileDrawer>
		</div>
	</div>
</div>
