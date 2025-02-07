import type { User, Session } from 'better-auth/types';
import type { FoldersReturnType } from './hooks.server';

declare global {
	namespace App {
		interface Locals {
			session: Session | undefined;
			user: User | undefined;
			folders: FoldersReturnType[] | undefined;
			mbUsed: number | undefined;
		}
	}
}

export { };