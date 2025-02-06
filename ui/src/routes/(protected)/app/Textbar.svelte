<script>
	import { browser } from '$app/environment';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { getAppState } from '$lib/stores/app.svelte';
	import { SendHorizontal } from 'lucide-svelte';
	import Mic from 'lucide-svelte/icons/mic';
	import { toast } from 'svelte-sonner';

	let speechRecognition = $state(
		browser ? window.SpeechRecognition || window.webkitSpeechRecognition : null
	);
	let isRecording = $state(false);
	const AppState = getAppState();
</script>

<form class="relative w-full px-2">
	<Input placeholder="Search" class="h-10 w-full rounded-full" bind:value={AppState.prompt} />
	{#if AppState.prompt}
		<Button
			onclick={() => AppState.sendPrompt()}
			class="absolute right-3 top-1/2 h-8 w-8 -translate-y-1/2 rounded-full transition-all duration-300 disabled:opacity-50"
			type="button"
			disabled={!AppState.prompt || AppState.isLoading}
		>
			<SendHorizontal />
		</Button>
	{:else}
		<Button
			onclick={async () => {
				if (speechRecognition) {
					const recognition = new speechRecognition();
					recognition.continuous = false;
					recognition.interimResults = true;
					recognition.lang = 'en-US';

					// check if any microphone is available
					const devices = await navigator.mediaDevices.enumerateDevices();
					console.debug('Devices: ', devices);
					const audioDevices = devices.filter((device) => device.kind === 'audioinput');
					if (!navigator.mediaDevices.getUserMedia || audioDevices.length === 0) {
						toast.error('No microphone detected!');
						return;
					}
					recognition.start();
					recognition.onstart = () => {
						console.debug('recognition started');
						isRecording = true;
					};
					recognition.onresult = (event) => {
						const transcript = Array.from(event.results)
							.map((result) => result[0])
							.map((result) => result.transcript)
							.join('');
						AppState.prompt = transcript;
					};
					recognition.onend = () => {
						console.debug('recognition ended');
						// if no audio is detected, show error
						if (!AppState.prompt) {
							toast.error('No audio detected, check your microphone!');
						}
						isRecording = false;
					};
				}
			}}
			class="absolute right-3 top-1/2 h-8 w-8 -translate-y-1/2 rounded-full transition-all duration-300 disabled:opacity-50"
			type="button"
			disabled={!!AppState.prompt || AppState.isLoading}
		>
			<Mic
				class={`${isRecording ? 'animate-pulse duration-500 hover:enabled:-translate-y-1' : ''}`}
			/>
		</Button>
	{/if}
</form>
