import { browser } from '$app/environment';
import { page } from '$app/state';
import type { File, Folder } from '$lib/server/db/schema';
import { getContext, setContext } from 'svelte';

export class AppState {
    appPage: 'home' | 'askme' | 'profile' = $state('home');
    prompt: string = $state('');
    folders: (Folder & { files: File[] })[] = $state([]);
    isLoading = $state(false);

    constructor() {
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
        // wait for 2 seconds
        await new Promise((resolve) => setTimeout(resolve, 2000));
        this.isLoading = false;
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