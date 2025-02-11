<script lang="ts">
	import * as InputOTP from '$lib/components/ui/input-otp/index.js';
	import { toast } from 'svelte-sonner';
	import Back from '../../Back.svelte';
	import { z } from 'zod';
	import { authClient } from '$lib/auth-client';
	import { REGEXP_ONLY_DIGITS } from 'bits-ui';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { Button } from '$lib/components/ui/button';
	import { minus } from 'drizzle-orm/singlestore-core';
	let { data } = $props();
	let isLoading = $state(false);

	let otpString = $state('');
	let otpTimeoutId = $state(-1);
	let otpResendTimeoutId = $state(-1);
	let isLoadingResendOtp = $state(false);
	let isResendOtpVisible = $state(false);
	let isResendOtpActive = $state(true);
	$effect(() => {
		if (otpString.length !== 5) return;
		(async () => {
			let { data: zdata, error } = z.string().length(5).transform(Number).safeParse(otpString);
			if (error) {
				toast.error(error.errors[0].message);
				otpString = '';
				return;
			}
			if (!zdata) {
				toast.error('Invalid OTP');
				otpString = '';
				return;
			}
			isLoading = true;
			toast.loading('Verifying OTP...', { id: 'login-otp', duration: 0 });
			const resp = await authClient.signIn.emailOtp({
				email: data.email,
				otp: zdata.toString()
			});
			if (resp.error) {
				toast.error(resp.error.message ?? 'Failed to verify OTP', { id: 'login-otp' });
				isLoading = false;
				return;
			}
			toast.success('OTP verified successfully', { id: 'login-otp' });
			isLoading = false;
			goto('/app/home');
		})();
	});

	onMount(() => {
		otpTimeoutId = setTimeout(() => {
			isResendOtpVisible = true;
		}, 5 * 1000) as unknown as number;
	});

	async function resendOtp() {
		isLoadingResendOtp = true;
		toast.loading('Sending OTP...', { id: 'resend-otp', duration: 0 });
		const resp = await authClient.emailOtp.sendVerificationOtp({
			email: data.email,
			type: 'sign-in' // or "email-verification", "forget-password"
		});
		if (resp.error) {
			toast.error(resp.error.message ?? 'Failed to re-send OTP', { id: 'resend-otp' });
			isLoadingResendOtp = false;
			return;
		}
		toast.success('OTP re-sent successfully', { id: 'resend-otp' });
		isLoadingResendOtp = false;
		// set new timeout
		isResendOtpActive = false;
		otpResendTimeoutId = setTimeout(() => {
			isResendOtpActive = true;
		}, 5 * 1000) as unknown as number;
	}
</script>

<Back />
<div class="flex h-full flex-col items-center justify-center gap-2">
	<h1>Enter Verification Code</h1>
	<h3>We've sent a five digit code to</h3>
	<h2>{data.email}</h2>
	<InputOTP.Root
		disabled={isLoading}
		maxlength={5}
		pattern={REGEXP_ONLY_DIGITS}
		bind:value={otpString}
	>
		{#snippet children({ cells })}
			{#each cells.slice(0, 5) as cell}
				<InputOTP.Group>
					<InputOTP.Slot {cell} />
				</InputOTP.Group>
			{/each}
		{/snippet}
	</InputOTP.Root>

	{#if isResendOtpVisible}
		{#if isLoadingResendOtp}
			<h3 class="text-2xl font-bold">Resending OTP...</h3>
		{:else}
			<Button
				class="w-full"
				onclick={resendOtp}
				disabled={isLoadingResendOtp || !isResendOtpActive}
				variant="link"
			>
				{#if isLoadingResendOtp}
					Resending OTP...
				{:else if isResendOtpActive}
					Resend OTP
				{:else}
					Resend OTP in 30s
				{/if}
			</Button>
		{/if}
	{/if}
</div>
