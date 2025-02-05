import type { User, Session } from 'better-auth/types';

declare global {
	namespace App {
		interface Locals {
			session: Session | undefined;
			user: User | undefined;
		}
	}
}

export {};