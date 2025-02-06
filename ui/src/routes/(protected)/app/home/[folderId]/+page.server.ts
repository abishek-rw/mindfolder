import type { File } from '$lib/server/db/schema.js';
import { redirect } from '@sveltejs/kit';

export const load = async ({ params, locals }) => {
    if (!locals.folders) return redirect(302, '/app?error=no-folders-found');
    const folderIdInt = parseInt(params.folderId);
    if (isNaN(folderIdInt)) return redirect(302, '/app?error=invalid-folder-id');
    const folder: ({
        id: number;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
    } & {
        files: File[];
    }) = locals.folders.find((folder) => folder.id === folderIdInt) ?? {
        id: folderIdInt,
        name: 'Folder Name.pdf',
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: 'abcduserid',
        files: [{
            id: folderIdInt,
            name: 'File Name',
            createdAt: new Date(),
            updatedAt: new Date(),
            userId: 'abcduserid',
            folderId: 123
        }]
    }
    return {
        folder
    }
};