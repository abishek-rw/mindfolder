import { auth } from '$lib/server/auth'; // path to your auth file
import { db } from '$lib/server/db';
import { svelteKitHandler } from 'better-auth/svelte-kit';

export async function handle({ event, resolve }) {
	const session = await auth.api.getSession({
		headers: event.request.headers
	});

	event.locals.session = session?.session;
	event.locals.user = session?.user;
	if (session?.user) {
		const folders = await db.query.folder.findMany({
			where: (folder, { eq }) => eq(folder.userId, session.user.id),
			with: {
				files: true
			}
		})
		event.locals.folders = folders
	}
	return svelteKitHandler({ event, resolve, auth });
}