import { redirect } from '@sveltejs/kit';

export const load = async ({ locals }) => {
    if (locals.user?.email !== locals.user?.name) {
        return redirect(302, '/app')
    }
};