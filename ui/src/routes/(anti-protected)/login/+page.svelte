<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { toast } from 'svelte-sonner';
	import { z } from 'zod';
	import { authClient } from '$lib/auth-client';
	let email = $state('');
	let isLoading = $state(false);

	async function sendOtp() {
		// validate email using zod
		const { data, error } = z.string().email().min(5).safeParse(email);
		if (error) {
			toast.error(error.errors[0].message);
			return;
		}
		if (!data) {
			toast.error('Invalid email');
			return;
		}
		isLoading = true;
		toast.loading('Sending OTP...', { id: 'login-otp', duration: 0 });
		const resp = await authClient.emailOtp.sendVerificationOtp({
			email: data,
			type: 'sign-in' // or "email-verification", "forget-password"
		});
		if (resp.error) {
			toast.error(resp.error.message ?? 'Failed to send OTP', { id: 'login-otp' });
			isLoading = false;
			return;
		}
		toast.success('OTP sent successfully', { id: 'login-otp' });
		isLoading = false;
		goto('/login/otp?email=' + email);
	}
</script>

<div class="flex w-full flex-col items-center gap-4">
	<h1>Sign In</h1>
	<form
		class="flex w-full flex-col items-center justify-center gap-2 p-4"
		onsubmit={async (e) => {
			e.preventDefault();
			await sendOtp();
		}}
	>
		<Input bind:value={email} class="w-full" placeholder="Enter your email address" />
		<Button disabled={isLoading || !email} type="submit" class="w-full">Get OTP</Button>
		<!-- <div>
			Don't have an account? <a href="/signup">Sign Up</a>
		</div> -->
	</form>
</div>
