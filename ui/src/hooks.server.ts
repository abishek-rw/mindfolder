import { auth } from '$lib/server/auth'; // path to your auth file
import { svelteKitHandler } from 'better-auth/svelte-kit';

export async function handle({ event, resolve }) {
	const session = await auth.api.getSession({
		headers: event.request.headers
	});

	event.locals.session = session?.session;
	event.locals.user = session?.user;

	return svelteKitHandler({ event, resolve, auth });
}