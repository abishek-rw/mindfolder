import { redirect } from '@sveltejs/kit';

export const load = async ({ params, locals }) => {
    if (!locals.folders) return redirect(302, '/app?error=no-folders-found');
    return {
        folders: locals.folders
    }
};