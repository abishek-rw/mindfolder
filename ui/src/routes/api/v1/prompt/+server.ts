import { SERVER_URL } from '$env/static/private';
import { error, json } from '@sveltejs/kit';

export const POST = async ({ fetch, request, locals }) => {
    if (!locals.session || !locals.user) return error(401);
    // 'prompt' should be in body
    const queryRequest = await request.json();
    console.log(queryRequest);
    if (!queryRequest.user_prompt) return error(400);
    const response = await fetch(`${SERVER_URL}/process-query`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            user_prompt: queryRequest.user_prompt,
            user_email: locals.user.email,
            ...(queryRequest.folder_name ? { folder_name: queryRequest.folder_name } : {})
        }),
    });
    const resp = await response.json();
    return json(resp);
};