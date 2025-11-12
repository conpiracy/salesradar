import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { Id } from './_generated/dataModel';

// ========== USER OPERATIONS ==========

export const createUser = mutation({
    args: {
        name: v.string(),
        email: v.string(),
        emailVerified: v.boolean(),
        image: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const userId = await ctx.db.insert('users', {
            name: args.name,
            email: args.email,
            emailVerified: args.emailVerified,
            image: args.image,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });

        // Create default settings and usage for new user
        await ctx.db.insert('settings', {
            userId,
            mode: 'dark',
            theme: 'default',
            modelId: 'kimi-k2',
            pinnedModels: [],
        });

        await ctx.db.insert('usage', {
            userId,
            credits: 0,
            search: 0,
            research: 0,
        });

        return userId;
    },
});

export const findUserByEmail = query({
    args: { email: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query('users')
            .withIndex('by_email', (q) => q.eq('email', args.email))
            .first();
    },
});

export const findUserById = query({
    args: { id: v.id('users') },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.id);
    },
});

export const updateUser = mutation({
    args: {
        id: v.id('users'),
        name: v.optional(v.string()),
        email: v.optional(v.string()),
        emailVerified: v.optional(v.boolean()),
        image: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const { id, ...updates } = args;
        await ctx.db.patch(id, {
            ...updates,
            updatedAt: Date.now(),
        });
    },
});

export const deleteUser = mutation({
    args: { id: v.id('users') },
    handler: async (ctx, args) => {
        // Delete user's related data
        const threads = await ctx.db
            .query('threads')
            .withIndex('by_userId', (q) => q.eq('userId', args.id))
            .collect();

        for (const thread of threads) {
            // Delete messages
            const messages = await ctx.db
                .query('messages')
                .withIndex('by_threadId', (q) => q.eq('threadId', thread._id))
                .collect();
            for (const message of messages) {
                await ctx.db.delete(message._id);
            }
            await ctx.db.delete(thread._id);
        }

        // Delete settings
        const settings = await ctx.db
            .query('settings')
            .withIndex('by_userId', (q) => q.eq('userId', args.id))
            .first();
        if (settings) await ctx.db.delete(settings._id);

        // Delete usage
        const usage = await ctx.db
            .query('usage')
            .withIndex('by_userId', (q) => q.eq('userId', args.id))
            .first();
        if (usage) await ctx.db.delete(usage._id);

        // Delete user
        await ctx.db.delete(args.id);
    },
});

// ========== SESSION OPERATIONS ==========

export const createSession = mutation({
    args: {
        sessionToken: v.string(),
        userId: v.id('users'),
        expiresAt: v.number(),
        ipAddress: v.optional(v.string()),
        userAgent: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert('sessions', {
            sessionToken: args.sessionToken,
            userId: args.userId,
            expiresAt: args.expiresAt,
            ipAddress: args.ipAddress,
            userAgent: args.userAgent,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });
    },
});

export const findSessionByToken = query({
    args: { token: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query('sessions')
            .withIndex('by_sessionToken', (q) => q.eq('sessionToken', args.token))
            .first();
    },
});

export const findSessionsByUserId = query({
    args: { userId: v.id('users') },
    handler: async (ctx, args) => {
        return await ctx.db
            .query('sessions')
            .withIndex('by_userId', (q) => q.eq('userId', args.userId))
            .collect();
    },
});

export const updateSession = mutation({
    args: {
        sessionToken: v.string(),
        expiresAt: v.optional(v.number()),
        ipAddress: v.optional(v.string()),
        userAgent: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const session = await ctx.db
            .query('sessions')
            .withIndex('by_sessionToken', (q) => q.eq('sessionToken', args.sessionToken))
            .first();

        if (!session) throw new Error('Session not found');

        const { sessionToken, ...updates } = args;
        await ctx.db.patch(session._id, {
            ...updates,
            updatedAt: Date.now(),
        });
    },
});

export const deleteSession = mutation({
    args: { sessionToken: v.string() },
    handler: async (ctx, args) => {
        const session = await ctx.db
            .query('sessions')
            .withIndex('by_sessionToken', (q) => q.eq('sessionToken', args.sessionToken))
            .first();

        if (session) {
            await ctx.db.delete(session._id);
        }
    },
});

export const deleteSessionsByUserId = mutation({
    args: { userId: v.id('users') },
    handler: async (ctx, args) => {
        const sessions = await ctx.db
            .query('sessions')
            .withIndex('by_userId', (q) => q.eq('userId', args.userId))
            .collect();

        for (const session of sessions) {
            await ctx.db.delete(session._id);
        }
    },
});

// ========== ACCOUNT OPERATIONS ==========

export const createAccount = mutation({
    args: {
        userId: v.id('users'),
        accountId: v.string(),
        providerId: v.string(),
        accessToken: v.optional(v.string()),
        refreshToken: v.optional(v.string()),
        expiresAt: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert('accounts', {
            userId: args.userId,
            accountId: args.accountId,
            providerId: args.providerId,
            accessToken: args.accessToken,
            refreshToken: args.refreshToken,
            expiresAt: args.expiresAt,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });
    },
});

export const findAccountByProviderId = query({
    args: {
        accountId: v.string(),
        providerId: v.string(),
    },
    handler: async (ctx, args) => {
        return await ctx.db
            .query('accounts')
            .withIndex('by_accountId', (q) => q.eq('accountId', args.accountId))
            .filter((q) => q.eq(q.field('providerId'), args.providerId))
            .first();
    },
});

export const findAccountsByUserId = query({
    args: { userId: v.id('users') },
    handler: async (ctx, args) => {
        return await ctx.db
            .query('accounts')
            .withIndex('by_userId', (q) => q.eq('userId', args.userId))
            .collect();
    },
});

export const updateAccount = mutation({
    args: {
        id: v.id('accounts'),
        accessToken: v.optional(v.string()),
        refreshToken: v.optional(v.string()),
        expiresAt: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const { id, ...updates } = args;
        await ctx.db.patch(id, {
            ...updates,
            updatedAt: Date.now(),
        });
    },
});

export const deleteAccount = mutation({
    args: { id: v.id('accounts') },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.id);
    },
});

// ========== VERIFICATION OPERATIONS ==========

export const createVerification = mutation({
    args: {
        identifier: v.string(),
        value: v.string(),
        expiresAt: v.number(),
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert('verifications', {
            identifier: args.identifier,
            value: args.value,
            expiresAt: args.expiresAt,
            createdAt: Date.now(),
        });
    },
});

export const findVerificationByIdentifier = query({
    args: { identifier: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query('verifications')
            .withIndex('by_identifier', (q) => q.eq('identifier', args.identifier))
            .first();
    },
});

export const deleteVerification = mutation({
    args: { identifier: v.string() },
    handler: async (ctx, args) => {
        const verification = await ctx.db
            .query('verifications')
            .withIndex('by_identifier', (q) => q.eq('identifier', args.identifier))
            .first();

        if (verification) {
            await ctx.db.delete(verification._id);
        }
    },
});
