import type { File, Folder } from '$lib/server/db/schema';
import type { User, Session } from 'better-auth/types';

declare global {
	namespace App {
		interface Locals {
			session: Session | undefined;
			user: User | undefined;
			folders: (Folder & { files: File[] })[] | undefined;
		}
	}
}

export { };