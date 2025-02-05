<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import { authClient } from '$lib/auth-client';
	import { Button } from '$lib/components/ui/button';
	import LogOut from 'lucide-svelte/icons/log-out';
	let isLoggingOut = $state(false);
</script>

<Button
	disabled={isLoggingOut}
	onclick={async (e) => {
		e.preventDefault();
		isLoggingOut = true;
		await authClient.signOut();
		invalidateAll();
		// goto('/login');
		isLoggingOut = false;
	}}
>
	<LogOut />
</Button>
