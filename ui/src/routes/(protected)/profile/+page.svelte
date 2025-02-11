<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import { authClient } from '$lib/auth-client';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { toast } from 'svelte-sonner';
	import { z } from 'zod';
	let name = $state('');
	let isLoading = $state(false);
	let disabled = $derived.by(() => isLoading || !name || name.length < 2);

	async function updateUser() {
		const { data, error } = z.string().min(2).safeParse(name);
		if (error) {
			toast.error(error.errors[0].message);
			return;
		}
		if (!data) {
			toast.error('Invalid name');
			return;
		}
		isLoading = true;
		toast.loading('Updating name...', { id: 'update-name', duration: 0 });
		const resp = await authClient.updateUser({ name: data });
		if (resp.error) {
			toast.error(resp.error.message ?? 'Failed to update name', { id: 'update-name' });
			isLoading = false;
			return;
		}
		toast.success(`Nice to meet you, ${name}!`, { id: 'update-name' });
		invalidateAll();
		goto('/app/home');
	}
</script>

<div class="flex h-full w-full flex-col items-center justify-center gap-2">
	<h2>What do we call you?</h2>
	<form class="flex flex-col gap-2" onsubmit={updateUser}>
		<Input placeholder="Name" min={2} bind:value={name} />
		<Button type="submit">Save</Button>
	</form>
</div>
