import { redirect } from '@sveltejs/kit';

export const load = async ({ locals, url }) => {
    // check if user's email and name are identical
    if (locals.user?.email === locals.user?.name) {
        return redirect(302, '/profile');
    }
    if(url.pathname === '/app') {
        return redirect(302, '/app/home');
    }
};