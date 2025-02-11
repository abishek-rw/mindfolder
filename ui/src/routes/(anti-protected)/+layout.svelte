<script lang="ts">
	let { children } = $props();
</script>

<div class="max-h-72 flex items-center justify-center">
	<img src="/assets/signup.png" alt="Mind Folder" class="h-full object-contain" />
</div>
<div class="flex flex-col grow min-h-0 mt-6 items-center">
	{@render children()}
</div>
