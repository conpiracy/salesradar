import { type Adapter } from 'better-auth';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';

/**
 * Custom Convex adapter for Better Auth
 * This adapter implements the Better Auth adapter interface to work with Convex
 */
export function convexAdapter(client: ConvexHttpClient): Adapter {
    return {
        id: 'convex',

        async create(data: { model: string; data: Record<string, any> }) {
            const { model, data: values } = data;

            switch (model) {
                case 'user':
                    const userId = await client.mutation(api.auth.createUser, {
                        name: values.name || '',
                        email: values.email,
                        emailVerified: values.emailVerified || false,
                        image: values.image,
                    });
                    return { ...values, id: userId };

                case 'session':
                    const sessionId = await client.mutation(api.auth.createSession, {
                        sessionToken: values.sessionToken,
                        userId: values.userId as Id<'users'>,
                        expiresAt: new Date(values.expiresAt).getTime(),
                        ipAddress: values.ipAddress,
                        userAgent: values.userAgent,
                    });
                    return { ...values, id: sessionId };

                case 'account':
                    const accountId = await client.mutation(api.auth.createAccount, {
                        userId: values.userId as Id<'users'>,
                        accountId: values.accountId,
                        providerId: values.providerId,
                        accessToken: values.accessToken,
                        refreshToken: values.refreshToken,
                        expiresAt: values.expiresAt ? new Date(values.expiresAt).getTime() : undefined,
                    });
                    return { ...values, id: accountId };

                case 'verification':
                    const verificationId = await client.mutation(api.auth.createVerification, {
                        identifier: values.identifier,
                        value: values.value,
                        expiresAt: new Date(values.expiresAt).getTime(),
                    });
                    return { ...values, id: verificationId };

                default:
                    throw new Error(`Model ${model} not supported`);
            }
        },

        async findOne(data: { model: string; where: Array<{ field: string; value: any }> }) {
            const { model, where } = data;
            const whereClause = where[0]; // Simplified - takes first where clause

            switch (model) {
                case 'user':
                    if (whereClause.field === 'email') {
                        return await client.query(api.auth.findUserByEmail, { email: whereClause.value });
                    } else if (whereClause.field === 'id') {
                        return await client.query(api.auth.findUserById, { id: whereClause.value as Id<'users'> });
                    }
                    break;

                case 'session':
                    if (whereClause.field === 'sessionToken') {
                        return await client.query(api.auth.findSessionByToken, { token: whereClause.value });
                    }
                    break;

                case 'account':
                    if (whereClause.field === 'accountId' && where.length > 1) {
                        const providerClause = where.find(w => w.field === 'providerId');
                        return await client.query(api.auth.findAccountByProviderId, {
                            accountId: whereClause.value,
                            providerId: providerClause?.value,
                        });
                    }
                    break;

                case 'verification':
                    if (whereClause.field === 'identifier') {
                        return await client.query(api.auth.findVerificationByIdentifier, {
                            identifier: whereClause.value,
                        });
                    }
                    break;
            }

            return null;
        },

        async findMany(data: { model: string; where?: Array<{ field: string; value: any }> }) {
            const { model, where } = data;

            if (!where || where.length === 0) {
                return [];
            }

            const whereClause = where[0];

            switch (model) {
                case 'session':
                    if (whereClause.field === 'userId') {
                        return await client.query(api.auth.findSessionsByUserId, {
                            userId: whereClause.value as Id<'users'>,
                        });
                    }
                    break;

                case 'account':
                    if (whereClause.field === 'userId') {
                        return await client.query(api.auth.findAccountsByUserId, {
                            userId: whereClause.value as Id<'users'>,
                        });
                    }
                    break;
            }

            return [];
        },

        async update(data: { model: string; where: Array<{ field: string; value: any }>; data: Record<string, any> }) {
            const { model, where, data: updates } = data;
            const whereClause = where[0];

            switch (model) {
                case 'user':
                    if (whereClause.field === 'id') {
                        await client.mutation(api.auth.updateUser, {
                            id: whereClause.value as Id<'users'>,
                            ...updates,
                        });
                    }
                    break;

                case 'session':
                    if (whereClause.field === 'sessionToken') {
                        await client.mutation(api.auth.updateSession, {
                            sessionToken: whereClause.value,
                            ...updates,
                        });
                    }
                    break;

                case 'account':
                    if (whereClause.field === 'id') {
                        await client.mutation(api.auth.updateAccount, {
                            id: whereClause.value as Id<'accounts'>,
                            ...updates,
                        });
                    }
                    break;
            }

            return updates;
        },

        async delete(data: { model: string; where: Array<{ field: string; value: any }> }) {
            const { model, where } = data;
            const whereClause = where[0];

            switch (model) {
                case 'user':
                    if (whereClause.field === 'id') {
                        await client.mutation(api.auth.deleteUser, {
                            id: whereClause.value as Id<'users'>,
                        });
                    }
                    break;

                case 'session':
                    if (whereClause.field === 'sessionToken') {
                        await client.mutation(api.auth.deleteSession, {
                            sessionToken: whereClause.value,
                        });
                    }
                    break;

                case 'account':
                    if (whereClause.field === 'id') {
                        await client.mutation(api.auth.deleteAccount, {
                            id: whereClause.value as Id<'accounts'>,
                        });
                    }
                    break;

                case 'verification':
                    if (whereClause.field === 'identifier') {
                        await client.mutation(api.auth.deleteVerification, {
                            identifier: whereClause.value,
                        });
                    }
                    break;
            }
        },

        async deleteMany(data: { model: string; where: Array<{ field: string; value: any }> }) {
            // For session cleanup
            const { model, where } = data;
            const whereClause = where[0];

            if (model === 'session' && whereClause.field === 'userId') {
                await client.mutation(api.auth.deleteSessionsByUserId, {
                    userId: whereClause.value as Id<'users'>,
                });
            }
        },
    };
}
