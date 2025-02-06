import { browser } from '$app/environment';
import { page } from '$app/state';
import { getContext, setContext } from 'svelte';

export class AppState {
    appPage: 'home' | 'askme' | 'profile' = $state('home');
    prompt: string = $state('');
    folders = $state([{
        folderId: 'abc',
        folderName: 'certificates',
        files: [
            {
                fileId: '123',
                fileName: 'certificate.pdf',
            },
            {
                fileId: '456',
                fileName: 'certificate2.xlsx',
            },
        ]
    }, {
        folderId: 'abc',
        folderName: 'certificates',
        files: [
            {
                fileId: '123',
                fileName: 'certificate.pdf',
            },
            {
                fileId: '456',
                fileName: 'certificate2.xlsx',
            },
        ]
    }, {
        folderId: 'abc',
        folderName: 'certificates',
        files: [
            {
                fileId: '123',
                fileName: 'certificate.pdf',
            },
            {
                fileId: '456',
                fileName: 'certificate2.xlsx',
            },
        ]
    }]);

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
}

const AppStateKey = Symbol('AppState');

export function setAppState() {
    return setContext(AppStateKey, new AppState());
}

export function getAppState() {
    return getContext<ReturnType<typeof setAppState>>(AppStateKey);
}