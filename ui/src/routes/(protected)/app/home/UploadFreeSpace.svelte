<script lang="ts">
	import { invalidate, invalidateAll } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import uploadFile from '$lib/fetchers/upload';
	import { Upload, UsersRound } from 'lucide-svelte';
	import { toast } from 'svelte-sonner';

	let isUploading = $state(false);

	function handleFileUpload(): Promise<File | null> {
		return new Promise((resolve, reject) => {
			// Create an input element of type "file"
			const input = document.createElement('input');
			input.type = 'file';
			input.accept = '.pdf, .txt, .docx'; // Restrict file types

			// Add an event listener for when the user selects a file
			input.onchange = () => {
				const files = input.files;
				if (files && files.length > 0) {
					resolve(files[0]); // Return the first selected file
				} else {
					resolve(null); // No file selected
				}
			};

			// Add an event listener for errors (optional)
			input.onerror = (error) => {
				reject(error);
			};

			// Programmatically trigger the click event to open the file picker
			input.click();
		});
	}
</script>

<div class="flex items-center justify-center gap-6 p-2 text-xs">
	<div class="flex flex-col items-center justify-center">
		<Button
			class="h-8 w-8 rounded-full"
			onclick={async (e) => {
				e.preventDefault();
				try {
					const file = await handleFileUpload();
					console.log(file);
					if (file) {
						isUploading = true;
						toast.loading('Uploading file...', { id: 'upload-file', duration: 0 });
						const resp = await uploadFile(file);
						if (!resp.ok) {
							throw new Error(resp.statusText);
						}
						await invalidateAll();
						toast.success('File uploaded successfully', { id: 'upload-file' });
					}
				} catch (error) {
					console.error('Error uploading file:', error);
					toast.error('Failed to upload file', { id: 'upload-file' });
				} finally {
					isUploading = false;
				}
			}}
			disabled={isUploading}><Upload /></Button
		>
		<div>Upload</div>
	</div>
	<div class="flex flex-col items-center justify-center">
		<Button class="h-8 w-8 rounded-full"><UsersRound /></Button>
		<div>Free Space</div>
	</div>
</div>
