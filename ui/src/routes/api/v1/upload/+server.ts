import { SERVER_URL } from '$env/static/private';
import { error } from '@sveltejs/kit';

export const POST = async ({ fetch, request, locals }) => {
    if (!locals.session || !locals.user) return error(401);
    const formData = await request.formData();
    // append email to form data
    formData.append('email', locals.user.email);
    const response = await fetch(`${SERVER_URL}/upload`, {
        method: 'POST',
        body: formData
    });
    return response;
};