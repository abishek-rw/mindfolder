import { page } from '$app/state';
import { getContext, setContext } from 'svelte';
import type { FoldersReturnType } from '../../hooks.server';
import postPrompt from '$lib/fetchers/prompt';
import { toast } from 'svelte-sonner';
import { goto } from '$app/navigation';

function extractPathSegment(path: string): string | null {
    const match = path.match(/^\/app\/home\/?(.*)$/);
    return match && match[1] ? match[1] : null;
}

// type KVResponseType = {
//     user_email: string;
//     folder_name: string;
//     response: {
//         file_name: string;
//         size: number;
//         file_date: string;
//         file_type: 'pdf' | 'docx' | 'md' | 'png' | 'jpg' | 'jpeg';
//     }[];
// } | {
//     user_email: string;
//     cluster_id: string;
//     response: string;
//     chunks_used: number;
//     total_chunks_available: number;
// }

type InputWithEmptyFolder = {
    user_prompt: string;
    folder_name: ""; // Empty folder
};

type InputWithFolder = {
    user_prompt: string;
    folder_name: string; // Non-empty folder
};

// Basic file metadata interface
export interface BaseItem {
    user_email: string;
    size: number;
    file_date: string;
}

// File interface

export interface File extends BaseItem {
    file_name: string;
    folder_name: string | null;
    file_type: string;
}

// Folder interface for nested structures

export interface Folder {
    name: string;
    items: (File | Folder)[];
}

// Generic grouped response type

export type GroupedResponse<T> = {
    [K: string]: T[];
}

// Response format for file listing with generic grouping

export interface FileListResponse {
    user_email: string;
    folder_name: string | null;
    response: GroupedResponse<File> | File[];
}

// Response format for file content

export interface FileContentResponse {
    user_email: string;
    cluster_id: string;
    response: string;
}

// Type guard to check if response is grouped

export function isGroupedResponse(response: FileListResponse['response']): response is GroupedResponse<File> {
    if (!response) return false;
    return !Array.isArray(response) &&
        typeof Object.keys(response)[0] === 'string' &&
        Array.isArray((response as GroupedResponse<File>)[Object.keys(response)[0]]);
}

// Union type for input
export type ApiInput = InputWithEmptyFolder | InputWithFolder;

// Conditional response type based on input
export type ApiResponse = FileListResponse | FileContentResponse;

export class AppState {
    appPage: 'home' | 'askme' | 'profile' = $state('home');
    prompt: string = $state('');
    folders: FoldersReturnType[] = $state([]);
    files = $derived.by(() => this.folders.map((folder) => folder.files).flat());
    isLoading = $state(false);
    KVs: {
        req: ApiInput;
        resp: ApiResponse;
    }[] = $state([
        {
            req: {
                "folder_name": "Professional_Portfolio",
                "user_prompt": "Files uploaded in the last 5 days"
            },
            resp: {
                "user_email": "abishekdevendran@gmail.com",
                "folder_name": "Professional_Portfolio",
                "response": []
            }
        }
    ]);

    constructor() {
        $inspect(this.files);
        $inspect(this.folders);
        $inspect(this.KVs);
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
        const match = extractPathSegment(page.url.pathname);
        const decodedMatch = decodeURIComponent(match ?? '');
        try {
            const resp = await postPrompt(this.prompt, match ? decodedMatch : undefined);
            const response = await resp.json() as ApiResponse;
            // Append to KVs
            this.KVs.push({
                req: {
                    folder_name: match ? decodedMatch : '',
                    user_prompt: this.prompt
                }, resp: response
            });
            if (page.url.pathname !== '/app/askme') {
                goto(`/app/askme`);
            }
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