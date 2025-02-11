<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import { authClient } from '$lib/auth-client';
	import { Button } from '$lib/components/ui/button';
	import LogOut from 'lucide-svelte/icons/log-out';
	import { toast } from 'svelte-sonner';
	let isLoggingOut = $state(false);
</script>

<Button
	disabled={isLoggingOut}
	onclick={async (e) => {
		e.preventDefault();
		isLoggingOut = true;
		toast.loading('Signing out...', { id: 'signout', duration: 0 });
		await authClient.signOut();
		toast.success('Signed out successfully', { id: 'signout' });
		invalidateAll();
		// goto('/login');
		isLoggingOut = false;
	}}
>
	<LogOut />
	Sign me out!
</Button>
