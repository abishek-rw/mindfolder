<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Drawer from '$lib/components/ui/drawer/index.js';
	import type { Snippet } from 'svelte';
	import Signout from './Signout.svelte';

	let {
		open = $bindable(),
		trigger
	}: { open: boolean; trigger: Snippet<[Record<string, unknown>]> } = $props();
</script>

<Drawer.Root {open} shouldScaleBackground={true}>
	<Drawer.Trigger>
		{#snippet child({ props: triggerProps })}
			{@render trigger(triggerProps)}
		{/snippet}
	</Drawer.Trigger>
	<Drawer.Content>
		<Drawer.Header>
			<Drawer.Title>Logout?</Drawer.Title>
			<Drawer.Description>You will be logged out from this device.</Drawer.Description>
		</Drawer.Header>
		<Drawer.Footer>
			<Signout />
			<Drawer.Close>Cancel</Drawer.Close>
		</Drawer.Footer>
	</Drawer.Content>
</Drawer.Root>
