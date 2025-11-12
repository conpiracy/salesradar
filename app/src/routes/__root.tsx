import '@/global.css';
import { HeadContent, Outlet, Scripts, createRootRoute } from '@tanstack/react-router';
import { cn } from '@/lib/utils';
import { Toaster } from '@/components/ui/sonner';
import { createServerFn } from '@tanstack/react-start';
import { Session, SessionLive } from '@/lib/auth';
import { getWebRequest } from '@tanstack/react-start/server';
import { Clock, Effect } from 'effect';
import { DatabaseLive } from '@/database/effect';
import { useEffect, useRef } from 'react';
import { z } from 'zod';
import { ProDialog } from '@/components/app/pro-dialog';
import { ConvexProvider, ConvexReactClient } from 'convex/react';
import { env } from '@/lib/env';
import { useSettings } from '@/hooks/use-database';

const convex = new ConvexReactClient(env.VITE_PUBLIC_CONVEX_URL);

const GetContextSchema = z.object({
    threadId: z.string().optional(),
});

const getContext = createServerFn({ method: 'GET' })
    .validator((obj: unknown) => {
        return GetContextSchema.parse(obj);
    })
    .handler(async ({ data }) => {
        const program = Effect.Do.pipe(
            Effect.let('request', () => getWebRequest()),
            Effect.flatMap(({ request }) => {
                return Effect.Do.pipe(
                    Effect.bind('now', () => Clock.currentTimeMillis),
                    Effect.bind('session', () => Session),
                    Effect.bind('end', () => Clock.currentTimeMillis),
                    Effect.tap(({ now, end }) => Effect.log(`SSR Duration: ${end - now}ms`)),
                    Effect.provide(SessionLive(request))
                );
            }),
            Effect.map(({ session }) => ({
                session,
            })),
            Effect.provide(DatabaseLive),
            Effect.catchAll(_ => Effect.succeed(undefined))
        );

        return Effect.runPromise(program);
    });

export const Route = createRootRoute({
    shouldReload: false,
    loader: async ({ params }) => {
        const context = await getContext({
            data: params,
        });

        return {
            session: context?.session,
        };
    },
    head: ctx => ({
        meta: [
            {
                charSet: 'utf-8',
            },
            {
                name: 'viewport',
                content: 'width=device-width, initial-scale=1',
            },
            {
                title: 'SalesRadar',
            },
            {
                name: 'description',
                content: 'Chat with models from OpenAI, Anthropic, and more.',
            },
        ],
        links: [
            {
                rel: 'preconnect',
                href: 'https://fonts.googleapis.com',
            },
            {
                rel: 'preconnect',
                href: 'https://fonts.gstatic.com',
                crossOrigin: 'anonymous',
            },
            {
                rel: 'stylesheet',
                href: 'https://fonts.googleapis.com/css2?family=Geist+Mono:wght@400;500;600;700&family=Geist:wght@400;500;600;700&family=IBM+Plex+Serif:wght@400;500;600;700&display=swap',
            },
        ],
    }),
    notFoundComponent: () => <div>Not found</div>,
    component: () => <RootDocument />,
});

function RootComponent({ htmlRef }: { htmlRef: React.RefObject<HTMLHtmlElement | null> }) {
    const settings = useSettings();
    const mountedRef = useRef(false);

    useEffect(() => {
        if (htmlRef.current) {
            htmlRef.current.className = cn(settings?.mode ?? 'dark', settings?.theme ?? 'default');
        }
    }, [settings?.mode, settings?.theme]);

    useEffect(() => {
        if (!mountedRef.current) {
            import('@/components/ui/markdown').then(module => {
                console.log('Markdown loaded');

                (window as any).__preload_markdown = {
                    default: module.Markdown,
                };
            });
        }
        mountedRef.current = true;
    }, []);

    return (
        <div className="fixed inset-0 flex text-foreground">
            <Outlet />
            <Toaster position="top-center" />
            <ProDialog />
        </div>
    );
}

function RootDocument() {
    const ref = useRef<HTMLHtmlElement>(null);
    const loaderData = Route.useLoaderData();

    return (
        <html
            lang="en"
            ref={ref}
            className="dark default"
        >
            <head>
                <HeadContent />
            </head>
            <body className="fixed inset-0">
                <ConvexProvider client={convex}>
                    <RootComponent htmlRef={ref} />
                </ConvexProvider>
                <Scripts />
            </body>
        </html>
    );
}
