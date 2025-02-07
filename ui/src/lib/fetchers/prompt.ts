import { PUBLIC_SERVER_VERSION } from "$env/static/public";

async function postPrompt(user_prompt: string, folder_name?: string) {
    const resp = await fetch(`/api/${PUBLIC_SERVER_VERSION}/prompt`, {
        method: 'POST',
        body: JSON.stringify({
            user_prompt,
            ...(folder_name ? { folder_name } : {})
        })
    });
    return resp;
}

export default postPrompt;