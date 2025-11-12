import { createServerFileRoute } from '@tanstack/react-start/server';
import { auth } from '@/lib/auth';
import { convexClient } from '@/lib/convex-client';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';

export const ServerRoute = createServerFileRoute('/api/thread/$threadId/stop').methods({
    async POST({ request, params }) {
        try {
            // Get session
            const session = await auth.api.getSession({
                headers: request.headers,
            });

            if (!session) {
                return new Response('Unauthorized', { status: 401 });
            }

            const threadId = params.threadId as Id<'threads'>;

            // Get thread to verify ownership
            const thread = await convexClient.query(api.queries.getThreadById, {
                threadId,
            });

            if (!thread) {
                return new Response('Thread not found', { status: 404 });
            }

            if (thread.userId !== session.user.id) {
                return new Response('You are not allowed to modify this thread', {
                    status: 403,
                });
            }

            // Update thread status to ready (stop streaming)
            await convexClient.mutation(api.queries.updateThreadStatus, {
                threadId,
                status: 'ready',
                streamId: undefined,
            });

            // Note: Redis pub/sub for abort has been removed
            // The AbortController in the main thread route will handle cancellation
            // when the client disconnects or the stream completes

            return new Response(null, { status: 200 });
        } catch (error: any) {
            console.error('[API] Error stopping thread', error);
            return new Response(error.message || 'Internal server error', {
                status: error.status || 500,
            });
        }
    },
});
