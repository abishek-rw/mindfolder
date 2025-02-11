import { SERVER_URL } from '$env/static/private';
import { auth } from '$lib/server/auth'; // path to your auth file
import { svelteKitHandler } from 'better-auth/svelte-kit';

export type FoldersReturnType = {
	folderName: string;
	files: {
		file_name: string;
		upload_date: string;
		upload_time: string;
		download_url: string;
	}[];
}
export async function handle({ event, resolve }) {
	const session = await auth.api.getSession({
		headers: event.request.headers
	});

	event.locals.session = session?.session;
	event.locals.user = session?.user;
	if (session?.user) {
		const [listFilesResp, userStorageUsedResp] = await Promise.all([
			fetch(`${SERVER_URL}/list-files?user_email=${encodeURIComponent(session.user.email)}`),
			fetch(`${SERVER_URL}/folder_size?user_email=${encodeURIComponent(session.user.email)}`),
		]);

		const folders = (await listFilesResp.json()) as {
			[key: string]: {
				file_name: string;
				upload_date: string;
				upload_time: string;
				download_url: string;
			}[];
		};

		const keys = Object.keys(folders);
		const transformedFolders: FoldersReturnType[] = keys.map((key) => ({
			folderName: key,
			files: folders[key],
		}));

		const userStorageUsedJson = (await userStorageUsedResp.json()) as {
			files: string; // "num MB"
		};
		event.locals.folders = transformedFolders;
		event.locals.mbUsed = parseFloat(userStorageUsedJson.files.split(' ')[0]) ?? 0;
	}
	return svelteKitHandler({ event, resolve, auth });
}