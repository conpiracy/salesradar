import { useQuery as useConvexQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Route } from '@/routes/__root';
import { useParamsThreadId } from '@/hooks/use-params-thread-id';

// Settings hook using Convex
export function useSettings() {
    const loaderData = Route.useLoaderData();
    const settings = useConvexQuery(api.settings.get);

    return settings ?? loaderData?.settings;
}

// Threads hook using Convex
export function useThreads() {
    const loaderData = Route.useLoaderData();
    const threads = useConvexQuery(api.threads.list);

    return threads ?? loaderData?.threads ?? [];
}

// Customer hook using Convex (subscription data)
export function useCustomer() {
    const loaderData = Route.useLoaderData();
    const customer = useConvexQuery(api.customers.get);

    return customer ?? loaderData?.customer;
}

// Usage hook using Convex (credits)
export function useUsage() {
    const loaderData = Route.useLoaderData();
    const usage = useConvexQuery(api.usage.get);

    return usage ?? loaderData?.usage;
}

// Thread from params hook
export function useThreadFromParams() {
    const threadId = useParamsThreadId();
    const loaderData = Route.useLoaderData();

    // Convex doesn't have the exact same query pattern as Zero
    // We'll need to fetch thread and messages separately or create a combined query
    const thread = useConvexQuery(
        api.threads.get,
        threadId ? { id: threadId as any } : 'skip'
    );

    const messages = useConvexQuery(
        api.messages.list,
        threadId ? { threadId: threadId as any } : 'skip'
    );

    if (thread && messages) {
        return {
            ...thread,
            messages,
        };
    }

    return (loaderData?.thread && loaderData.thread.id === threadId
        ? loaderData.thread
        : undefined) as any;
}

// User hook using Convex
export function useUser() {
    const loaderData = Route.useLoaderData();
    const user = useConvexQuery(api.users.getCurrent);

    return user ?? loaderData?.user;
}
