import { redirect } from '@sveltejs/kit';

export const load = async ({ params, locals }) => {
    if (!locals.folders) return redirect(302, '/app?error=no-folders-found');
    const folderNameId = params.folderNameId;
    if(!folderNameId) return redirect(302, '/app/home?error=invalid-folder-name-id');
    const folder = locals.folders.find((folder) => folder.folderName === params.folderNameId)
    if(!folder) return redirect(302, '/app/home?error=folder-not-found');
    return {
        folder
    }
};