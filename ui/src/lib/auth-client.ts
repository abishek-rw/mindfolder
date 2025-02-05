import { PUBLIC_BASE_URL } from "$env/static/public"
import { createAuthClient } from "better-auth/client"
import { emailOTPClient } from "better-auth/client/plugins"
 
export const authClient =  createAuthClient({
    baseURL: PUBLIC_BASE_URL,
    plugins: [
        emailOTPClient()
    ]
})