import { createServerFileRoute } from '@tanstack/react-start/server';
import { getResumableStream, prepareResumeThreadContext } from '@/ai/service-convex';
import { auth } from '@/lib/auth';
import { convexClient } from '@/lib/convex-client';
import { Id } from '../../convex/_generated/dataModel';

export const ServerRoute = createServerFileRoute('/api/thread/$threadId/stream').methods({
    async GET({ request, params: { threadId } }) {
        try {
            // Get session
            const session = await auth.api.getSession({
                headers: request.headers,
            });

            if (!session) {
                return new Response('Unauthorized', { status: 401 });
            }

            // Prepare resume context
            const streamId = await prepareResumeThreadContext(convexClient, {
                threadId: threadId as Id<'threads'>,
                userId: session.user.id as Id<'users'>,
            });

            // Get resumable stream
            const stream = await getResumableStream(streamId);

            if (!stream) {
                return new Response('Stream not found', { status: 404 });
            }

            return new Response(stream, {
                headers: {
                    'Content-Type': 'text/event-stream',
                    'Cache-Control': 'no-cache',
                    Connection: 'keep-alive',
                },
            });
        } catch (error: any) {
            console.error('[API] Error resuming stream', error);
            return new Response(error.message || 'Internal server error', {
                status: error.status || 500,
            });
        }
    },
});
