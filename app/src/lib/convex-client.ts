import { ConvexHttpClient } from 'convex/browser';
import { env } from '@/lib/env';

// Server-side Convex HTTP client
// This client can be used in API routes and server-side code
export const convexClient = new ConvexHttpClient(env.VITE_PUBLIC_CONVEX_URL);

// Helper to get authenticated client with user token
export function getAuthenticatedConvexClient(token?: string) {
    const client = new ConvexHttpClient(env.VITE_PUBLIC_CONVEX_URL);
    if (token) {
        client.setAuth(token);
    }
    return client;
}
