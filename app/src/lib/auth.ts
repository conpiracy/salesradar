import { env } from '@/lib/env';
import MagicLinkEmail from '@/emails/magic-link';
import { resend } from '@/lib/resend';
import { betterAuth } from 'better-auth';
import { anonymous, emailOTP, jwt, magicLink, organization } from 'better-auth/plugins';
import { Effect, Layer } from 'effect';
import { APIError } from '@/lib/error';
import { reactStartCookies } from 'better-auth/react-start';
import { setHeaders } from '@tanstack/react-start/server';
import { convexAdapter } from '@/lib/convex-auth-adapter';
import { convexClient } from '@/lib/convex-client';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';

export const auth = betterAuth({
    database: convexAdapter(convexClient),
    trustedOrigins: ['https://zeron.sh', 'https://www.zeron.sh', 'http://localhost:5173'],
    session: {
        expiresIn: 60 * 60 * 24 * 365,
        updateAge: 60 * 60 * 24,
    },
    socialProviders: {
        google: {
            clientId: env.GOOGLE_CLIENT_ID,
            clientSecret: env.GOOGLE_CLIENT_SECRET,
        },
        github: {
            clientId: env.GITHUB_CLIENT_ID,
            clientSecret: env.GITHUB_CLIENT_SECRET,
        },
    },
    // Database hooks removed - now handled in Convex auth.createUser function
    plugins: [
        reactStartCookies(),
        organization(),
        jwt(),
        magicLink({
            sendMagicLink: async ({ email, token, url }) => {
                console.log({
                    email,
                    token,
                    url,
                });

                await resend.emails.send({
                    from: 'Zeron <no-reply@zeron.sh>',
                    to: email,
                    subject: 'Your magic link',
                    react: MagicLinkEmail({ url }),
                });
            },
        }),
        emailOTP({
            sendVerificationOTP: async ({ email, otp, type }) => {
                console.log({
                    email,
                    otp,
                    type,
                });
            },
        }),
        anonymous({
            onLinkAccount: async ({ anonymousUser, newUser }) => {
                // Transfer threads and messages from anonymous user to authenticated user
                await convexClient.mutation(api.queries.transferThreads, {
                    fromUserId: anonymousUser.user.id as Id<'users'>,
                    toUserId: newUser.user.id as Id<'users'>,
                });
            },
        }),
    ],
});

const getSession = Effect.fn('getSession')(function* (request: Request) {
    let session = yield* Effect.tryPromise(() =>
        auth.api.getSession({
            headers: request.headers,
        })
    );

    if (!session) {
        const newUser = yield* Effect.tryPromise(() => {
            return auth.api.signInAnonymous({
                headers: request.headers,
                returnHeaders: true,
            });
        });

        const setCookieHeader = newUser.headers.get('set-cookie');

        if (setCookieHeader) {
            setHeaders({
                'set-cookie': setCookieHeader,
            });
        }

        const requestHeaders = new Headers(request.headers);

        if (setCookieHeader) {
            const cookies = setCookieHeader.split(',').map(cookie => cookie.trim());
            const cookieValues: string[] = [];

            const existingCookies = requestHeaders.get('Cookie');
            if (existingCookies) {
                cookieValues.push(existingCookies);
            }

            for (const cookie of cookies) {
                const [nameValue] = cookie.split(';');
                if (nameValue) {
                    cookieValues.push(nameValue.trim());
                }
            }

            requestHeaders.set('Cookie', cookieValues.join('; '));
        }

        session = yield* Effect.tryPromise(() => {
            return auth.api.getSession({
                headers: requestHeaders,
            });
        });
    }

    if (!session) {
        return yield* new APIError({
            status: 401,
            message: 'Unauthorized',
        });
    }

    return session;
});

type Shape = NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>;

export class Session extends Effect.Tag('Session')<Session, Shape>() {}

export const SessionLive = (request: Request) =>
    Layer.scoped(
        Session,
        Effect.gen(function* () {
            return yield* getSession(request);
        })
    );
