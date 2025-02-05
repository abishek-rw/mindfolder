import { redirect } from '@sveltejs/kit';

export const load = async ({ route, url }) => {
    let email = url.searchParams.get("email");
    if (!email) {
        return redirect(302, "/login?error=invalid-email");
    }
    return {
        email
    }
};