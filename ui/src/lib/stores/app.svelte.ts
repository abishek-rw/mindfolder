import { page } from '$app/state';
import { getContext, setContext } from 'svelte';
import type { FoldersReturnType } from '../../hooks.server';
import postPrompt from '$lib/fetchers/prompt';
import { toast } from 'svelte-sonner';

export class AppState {
    appPage: 'home' | 'askme' | 'profile' = $state('home');
    prompt: string = $state('');
    folders: FoldersReturnType[] = $state([]);
    isLoading = $state(false);

    constructor() {
        $inspect(this.folders);
        $inspect(page.url.pathname);
        $effect(() => {
            if (page.url.pathname === '/app/askme') {
                this.appPage = 'askme';
            } else if (page.url.pathname === '/app/profile') {
                this.appPage = 'profile';
            } else {
                this.appPage = 'home';
            }
        });
    }

    async sendPrompt() {
        this.isLoading = true;
        // try to regex match /app/home/Professional_Portfolio/<filename> from page.url.pathname
        const match = page.url.pathname.match(/\/app\/home\/(.*)\/(.*)/);
        try {

            const resp = await postPrompt(this.prompt, match ? match[1] : undefined);
            const response = await resp.json();
            console.log(response);
            this.prompt = '';
        } catch (error) {
            console.error(error);
            toast.error('Something went wrong. Please try again.');
        } finally {
            this.isLoading = false;
        }
        return prompt;
    }
}

const AppStateKey = Symbol('AppState');

export function setAppState() {
    return setContext(AppStateKey, new AppState());
}

export function getAppState() {
    return getContext<ReturnType<typeof setAppState>>(AppStateKey);
}