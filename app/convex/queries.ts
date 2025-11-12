import { v } from 'convex/values';
import { query, mutation } from './_generated/server';
import { Id } from './_generated/dataModel';

/**
 * Complex query to get thread context with all related data
 * Used by AI service to prepare thread context
 */
export const getThreadContext = query({
    args: {
        threadId: v.id('threads'),
        modelId: v.string(),
        userId: v.id('users'),
    },
    handler: async (ctx, args) => {
        // Get all data in parallel
        const [thread, model, settings, usage, customer] = await Promise.all([
            ctx.db.get(args.threadId),
            ctx.db
                .query('models')
                .withIndex('by_modelId', (q) => q.eq('modelId', args.modelId))
                .first(),
            ctx.db
                .query('settings')
                .withIndex('by_userId', (q) => q.eq('userId', args.userId))
                .first(),
            ctx.db
                .query('usage')
                .withIndex('by_userId', (q) => q.eq('userId', args.userId))
                .first(),
            ctx.db
                .query('userCustomers')
                .withIndex('by_userId', (q) => q.eq('userId', args.userId))
                .first(),
        ]);

        return {
            thread,
            model,
            settings,
            usage,
            customer,
        };
    },
});

/**
 * Get thread message history
 */
export const getThreadMessages = query({
    args: { threadId: v.id('threads') },
    handler: async (ctx, args) => {
        return await ctx.db
            .query('messages')
            .withIndex('by_threadId_createdAt', (q) => q.eq('threadId', args.threadId))
            .order('asc')
            .collect();
    },
});

/**
 * Create thread and initial message atomically
 */
export const createThreadWithMessage = mutation({
    args: {
        userId: v.id('users'),
        message: v.any(),
        streamId: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const threadId = await ctx.db.insert('threads', {
            userId: args.userId,
            status: 'submitted',
            streamId: args.streamId,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });

        const messageId = await ctx.db.insert('messages', {
            threadId,
            userId: args.userId,
            message: args.message,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });

        return { threadId, messageId };
    },
});

/**
 * Update thread status and optionally set stream ID
 */
export const updateThreadStatus = mutation({
    args: {
        threadId: v.id('threads'),
        status: v.union(v.literal('ready'), v.literal('streaming'), v.literal('submitted')),
        streamId: v.optional(v.string()),
        title: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const { threadId, ...updates } = args;
        await ctx.db.patch(threadId, {
            ...updates,
            updatedAt: Date.now(),
        });
    },
});

/**
 * Save AI response message
 */
export const saveMessage = mutation({
    args: {
        threadId: v.id('threads'),
        userId: v.id('users'),
        message: v.any(),
    },
    handler: async (ctx, args) => {
        const messageId = await ctx.db.insert('messages', {
            threadId: args.threadId,
            userId: args.userId,
            message: args.message,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });

        // Update thread's updatedAt
        await ctx.db.patch(args.threadId, {
            updatedAt: Date.now(),
        });

        return messageId;
    },
});

/**
 * Get user by ID (server-side helper)
 */
export const getUserById = query({
    args: { userId: v.id('users') },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.userId);
    },
});

/**
 * Get model by modelId string
 */
export const getModelByModelId = query({
    args: { modelId: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query('models')
            .withIndex('by_modelId', (q) => q.eq('modelId', args.modelId))
            .first();
    },
});

/**
 * Get settings by user ID
 */
export const getSettingsByUserId = query({
    args: { userId: v.id('users') },
    handler: async (ctx, args) => {
        return await ctx.db
            .query('settings')
            .withIndex('by_userId', (q) => q.eq('userId', args.userId))
            .first();
    },
});

/**
 * Get usage by user ID
 */
export const getUsageByUserId = query({
    args: { userId: v.id('users') },
    handler: async (ctx, args) => {
        return await ctx.db
            .query('usage')
            .withIndex('by_userId', (q) => q.eq('userId', args.userId))
            .first();
    },
});

/**
 * Get customer by user ID
 */
export const getCustomerByUserId = query({
    args: { userId: v.id('users') },
    handler: async (ctx, args) => {
        return await ctx.db
            .query('userCustomers')
            .withIndex('by_userId', (q) => q.eq('userId', args.userId))
            .first();
    },
});

/**
 * Get thread by ID
 */
export const getThreadById = query({
    args: { threadId: v.id('threads') },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.threadId);
    },
});

/**
 * Get thread by stream ID
 */
export const getThreadByStreamId = query({
    args: { streamId: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query('threads')
            .withIndex('by_streamId', (q) => q.eq('streamId', args.streamId))
            .first();
    },
});

/**
 * Transfer threads from anonymous user to authenticated user
 */
export const transferThreads = mutation({
    args: {
        fromUserId: v.id('users'),
        toUserId: v.id('users'),
    },
    handler: async (ctx, args) => {
        // Get all threads from anonymous user
        const threads = await ctx.db
            .query('threads')
            .withIndex('by_userId', (q) => q.eq('userId', args.fromUserId))
            .collect();

        // Transfer each thread
        for (const thread of threads) {
            await ctx.db.patch(thread._id, {
                userId: args.toUserId,
                updatedAt: Date.now(),
            });

            // Transfer all messages in this thread
            const messages = await ctx.db
                .query('messages')
                .withIndex('by_threadId', (q) => q.eq('threadId', thread._id))
                .collect();

            for (const message of messages) {
                await ctx.db.patch(message._id, {
                    userId: args.toUserId,
                    updatedAt: Date.now(),
                });
            }
        }

        return threads.length;
    },
});

/**
 * Check if user exists by email
 */
export const userExistsByEmail = query({
    args: { email: v.string() },
    handler: async (ctx, args) => {
        const user = await ctx.db
            .query('users')
            .withIndex('by_email', (q) => q.eq('email', args.email))
            .first();
        return !!user;
    },
});
