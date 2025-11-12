import { ThreadMessage } from '@/ai/types';
import {
    convertToModelMessages,
    createUIMessageStream,
    generateText,
    JsonToSseTransformStream,
} from 'ai';
import { createResumableStreamContext, ResumableStreamContext } from 'resumable-stream';
import { APIError } from '@/lib/error';
import { AnonymousLimits, FreeLimits, ProLimits } from '@/lib/constants';
import { match } from 'ts-pattern';
import { waitUntil } from '@vercel/functions';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';

let streamContext: ResumableStreamContext | undefined = undefined;

export function getStreamContext() {
    if (!streamContext) {
        streamContext = createResumableStreamContext({
            waitUntil,
        });
    }
    return streamContext;
}

/**
 * Prepare thread context for AI streaming using Convex
 */
export async function prepareThreadContext(
    convex: ConvexHttpClient,
    args: {
        isAnonymous: boolean;
        userId: Id<'users'>;
        threadId: Id<'threads'> | string;
        streamId: string;
        modelId: string;
        message: ThreadMessage;
    }
) {
    console.log('[AI Service] Preparing thread context');

    // Convert threadId to Id<'threads'> if it's a string (for new threads)
    let threadIdTyped: Id<'threads'>;
    let thread: any = null;
    let isNewThread = false;

    if (typeof args.threadId === 'string' && !args.threadId.startsWith('j')) {
        // This is a temporary ID for a new thread
        isNewThread = true;
    } else {
        threadIdTyped = args.threadId as Id<'threads'>;
        thread = await convex.query(api.queries.getThreadById, { threadId: threadIdTyped });
    }

    // Get all required data in parallel
    const [model, settings, usage, customer] = await Promise.all([
        convex.query(api.queries.getModelByModelId, { modelId: args.modelId }),
        convex.query(api.queries.getSettingsByUserId, { userId: args.userId }),
        convex.query(api.queries.getUsageByUserId, { userId: args.userId }),
        convex.query(api.queries.getCustomerByUserId, { userId: args.userId }),
    ]);

    // Validation
    if (!settings) {
        throw new Error('Settings for user does not exist');
    }

    if (!usage) {
        throw new Error('Usage for user does not exist');
    }

    if (!model) {
        throw new Error('Model with modelId does not exist');
    }

    // Create thread if it doesn't exist
    if (!thread) {
        console.log('[AI Service] Creating thread');
        const result = await convex.mutation(api.queries.createThreadWithMessage, {
            userId: args.userId,
            message: args.message,
            streamId: args.streamId,
        });
        threadIdTyped = result.threadId;
        thread = await convex.query(api.queries.getThreadById, { threadId: threadIdTyped });
    } else {
        // Verify thread ownership and status
        if (thread.status === 'streaming') {
            throw new Error('Thread is already streaming');
        }

        if (thread.userId !== args.userId) {
            throw new Error('User is not the owner of the thread');
        }

        // Update thread status to streaming
        await convex.mutation(api.queries.updateThreadStatus, {
            threadId: threadIdTyped,
            status: 'streaming',
            streamId: args.streamId,
        });

        // Create the user message
        await convex.mutation(api.queries.saveMessage, {
            threadId: threadIdTyped,
            userId: args.userId,
            message: args.message,
        });
    }

    // Check credit limits
    const limits = getLimits({
        customer,
        isAnonymous: args.isAnonymous,
    });

    if (limits.CREDITS - (usage.credits || 0) - model.credits < 0) {
        throw new Error('You have reached your credit limit.');
    }

    // Get message history
    const messages = await convex.query(api.queries.getThreadMessages, {
        threadId: threadIdTyped!,
    });
    const history = messages.map(m => m.message);

    return {
        threadId: threadIdTyped!,
        model,
        history,
        settings,
        usage,
        limits,
        thread,
    };
}

/**
 * Convert UI messages to model messages with file handling
 */
export async function convertUIMessagesToModelMessages(
    messages: ThreadMessage[],
    options: {
        supportsImages?: boolean;
        supportsDocuments?: boolean;
    } = {
        supportsImages: false,
        supportsDocuments: false,
    }
) {
    return convertToModelMessages(
        await Promise.all(
            messages.map(async message => {
                message.parts = message.parts.filter(part => {
                    if (part.type === 'file') {
                        if (
                            (part.mediaType.startsWith('application/pdf') ||
                                part.mediaType.startsWith('text/plain')) &&
                            !options.supportsDocuments
                        ) {
                            return false;
                        }
                        if (part.mediaType.startsWith('image/') && !options.supportsImages) {
                            return false;
                        }
                    }
                    return true;
                });

                for (const part of message.parts) {
                    if (part.type === 'file') {
                        if (
                            part.mediaType.startsWith('application/pdf') ||
                            part.mediaType.startsWith('text/plain')
                        ) {
                            // @ts-expect-error - TODO: fix this
                            part.url = await fetch(part.url)
                                .then(res => res.blob())
                                .then(blob => blob.arrayBuffer());
                        }
                    }
                }

                return message;
            })
        )
    );
}

/**
 * Create resumable stream with retries
 */
export async function createResumableStream(
    streamId: string,
    stream: ReadableStream<string>
): Promise<ReadableStream<string>> {
    try {
        return await getStreamContext().createNewResumableStream(streamId, () => stream);
    } catch (error) {
        console.error('Error creating resumable stream', error);
        return stream;
    }
}

/**
 * Get existing resumable stream
 */
export async function getResumableStream(streamId: string): Promise<ReadableStream<Uint8Array> | null> {
    try {
        const emptyDataStream = createUIMessageStream({
            execute: () => {},
        });
        return await getStreamContext().resumableStream(streamId, () =>
            emptyDataStream.pipeThrough(new JsonToSseTransformStream())
        );
    } catch (error) {
        console.error('Error getting resumable stream', error);
        return null;
    }
}

/**
 * Prepare context for resuming a stream
 */
export async function prepareResumeThreadContext(
    convex: ConvexHttpClient,
    args: { threadId: Id<'threads'>; userId: Id<'users'> }
) {
    const thread = await convex.query(api.queries.getThreadById, { threadId: args.threadId });

    if (!thread) {
        throw new Error('Thread not found');
    }

    if (thread.userId !== args.userId) {
        throw new Error('User is not the owner of the thread');
    }

    if (thread.status !== 'streaming') {
        throw new Error('Thread is not streaming');
    }

    if (!thread.streamId) {
        throw new Error('Thread is not streaming');
    }

    return thread.streamId;
}

/**
 * Generate thread title based on first message
 */
export async function generateThreadTitle(
    convex: ConvexHttpClient,
    threadId: Id<'threads'>,
    message: ThreadMessage
) {
    console.log('[AI Service] Generating thread title');

    try {
        const { text } = await generateText({
            model: 'google/gemini-2.0-flash-001',
            system: `
                - you will generate a short title based on the first message a user begins a conversation with
                - ensure it is not more than 80 characters long
                - the title should be a summary of the user's message
                - do not use quotes or colons`,
            temperature: 0.8,
            messages: convertToModelMessages([message]),
        });

        await convex.mutation(api.queries.updateThreadStatus, {
            threadId,
            status: 'streaming', // Keep current status
            title: text,
        });
    } catch (error) {
        console.error('Error generating thread title', error);
    }
}

/**
 * Increment usage (deduct credits)
 */
export async function incrementUsage(
    convex: ConvexHttpClient,
    userId: Id<'users'>,
    type: 'search' | 'research' | 'credits',
    amount: number
) {
    console.log(`[AI Service] Incrementing usage for ${type} by ${amount}`);

    if (type === 'credits') {
        await convex.mutation(api.usage.deductCreditsByUserId, {
            userId,
            amount,
        });
    }
    // TODO: Add search and research deduction if needed
}

/**
 * Save AI response message and reset thread status
 */
export async function saveMessageAndResetThreadStatus(
    convex: ConvexHttpClient,
    args: {
        threadId: Id<'threads'>;
        userId: Id<'users'>;
        message: ThreadMessage;
    }
) {
    console.log('[AI Service] Saving message and resetting thread status');

    // Save message and update thread status atomically
    await Promise.all([
        convex.mutation(api.queries.saveMessage, {
            threadId: args.threadId,
            userId: args.userId,
            message: args.message,
        }),
        convex.mutation(api.queries.updateThreadStatus, {
            threadId: args.threadId,
            status: 'ready',
            streamId: undefined,
        }),
    ]);
}

/**
 * Get usage limits based on customer subscription
 */
export function getLimits(args: { customer?: any; isAnonymous: boolean }) {
    const currentPeriodEnd = args.customer?.subscription?.currentPeriodEnd ?? 0;
    const now = Date.now();
    const isPro = Number(currentPeriodEnd) > now;

    return match({
        isPro,
        isAnonymous: args.isAnonymous,
    })
        .with(
            {
                isPro: true,
                isAnonymous: false,
            },
            () => ProLimits
        )
        .with(
            {
                isPro: false,
                isAnonymous: false,
            },
            () => FreeLimits
        )
        .with(
            {
                isPro: false,
                isAnonymous: true,
            },
            () => AnonymousLimits
        )
        .otherwise(() => AnonymousLimits);
}
