import { createServerFileRoute } from '@tanstack/react-start/server';
import { auth } from '@/lib/auth';
import { z } from 'zod';
import { nanoid } from 'nanoid';
import {
    streamText,
    createUIMessageStream,
    JsonToSseTransformStream,
    extractReasoningMiddleware,
    smoothStream,
    stepCountIs,
    wrapLanguageModel,
} from 'ai';
import { getTools } from '@/ai/tools';
import { getSystemPrompt } from '@/ai/prompt';
import {
    convertUIMessagesToModelMessages,
    createResumableStream,
    generateThreadTitle,
    incrementUsage,
    prepareThreadContext,
    saveMessageAndResetThreadStatus,
} from '@/ai/service-convex';
import type { OpenAIResponsesProviderOptions } from '@ai-sdk/openai';
import type { GoogleGenerativeAIProviderOptions } from '@ai-sdk/google';
import type { AnthropicProviderOptions } from '@ai-sdk/anthropic';
import { gateway } from '@ai-sdk/gateway';
import { convexClient } from '@/lib/convex-client';
import { Id } from '../../convex/_generated/dataModel';
import { ThreadMessage } from '@/ai/types';

const ThreadPostApiSchema = z.object({
    id: z.string(),
    modelId: z.string(),
    message: z.any(),
    tool: z.string().optional(),
});

export const ServerRoute = createServerFileRoute('/api/thread').methods({
    async POST({ request }) {
        try {
            // Get session
            const session = await auth.api.getSession({
                headers: request.headers,
            });

            if (!session) {
                return new Response('Unauthorized', { status: 401 });
            }

            // Parse request body
            const json = await request.json();
            const body = ThreadPostApiSchema.parse(json);

            // Generate stream ID
            const streamId = nanoid();

            // Abort controller for stream cancellation
            const controller = new AbortController();

            // Prepare thread context using Convex
            const context = await prepareThreadContext(convexClient, {
                isAnonymous: session.user.isAnonymous ?? false,
                userId: session.user.id as Id<'users'>,
                threadId: body.id,
                streamId,
                modelId: body.modelId,
                message: body.message,
            });

            const { threadId, history, model, settings, usage, limits } = context;

            // Convert UI messages to model messages
            const messages = await convertUIMessagesToModelMessages(history, {
                supportsImages: model.capabilities.includes('vision'),
                supportsDocuments: model.capabilities.includes('documents'),
            });

            const activeTools = [body.tool].filter((tool): tool is string => tool !== undefined);

            // Model middleware configuration
            const MODEL_REQUIRES_MIDDLEWARE = [
                'zai/glm-4.5-air',
                'zai/glm-4.5',
                'deepseek/deepseek-r1-distill-llama-70b',
                'deepseek/deepseek-r1',
            ];

            const actualModel = MODEL_REQUIRES_MIDDLEWARE.includes(model.model)
                ? wrapLanguageModel({
                      model: gateway(model.model),
                      middleware: extractReasoningMiddleware({
                          tagName: 'think',
                      }),
                  })
                : model.model;

            // OpenAI configuration
            const OPENAI_MODELS_WITH_REASONING = [
                'openai/gpt-5',
                'openai/gpt-5-mini',
                'openai/gpt-5-nano',
            ];
            const openai: OpenAIResponsesProviderOptions = {
                parallelToolCalls: false,
            };

            if (OPENAI_MODELS_WITH_REASONING.includes(model.model)) {
                openai.include = ['reasoning.encrypted_content'];
                openai.reasoningSummary = 'auto';
            }

            // Google configuration
            const GOOGLE_MODELS_WITH_REASONING = ['google/gemini-2.5-flash', 'google/gemini-2.5-pro'];
            const google: GoogleGenerativeAIProviderOptions = {};

            if (GOOGLE_MODELS_WITH_REASONING.includes(model.model)) {
                google.thinkingConfig = {
                    includeThoughts: true,
                };
            }

            // Anthropic configuration
            const anthropic: AnthropicProviderOptions = {
                sendReasoning: true,
                thinking: {
                    type: 'enabled',
                    budgetTokens: 3000,
                },
                disableParallelToolUse: true,
            };

            console.log('[API] Creating stream');

            // Get tools - simplified version without Effect
            const tools = getTools({
                writer: null as any, // Will be set in execute
                usage,
                userId: session.user.id as Id<'users'>,
                limits,
                runtime: null as any,
                tools: activeTools,
                signal: controller.signal,
            });

            // Create UI message stream
            const stream = createUIMessageStream<ThreadMessage>({
                onFinish: async ({ responseMessage }) => {
                    try {
                        await saveMessageAndResetThreadStatus(convexClient, {
                            threadId,
                            userId: session.user.id as Id<'users'>,
                            message: responseMessage,
                        });
                    } catch (error) {
                        console.error('[API] Error saving message', error);
                    }
                },
                execute: ({ writer }) => {
                    const result = streamText({
                        model: actualModel,
                        messages,
                        temperature: 0.8,
                        maxSteps: 3,
                        system: getSystemPrompt(settings, activeTools),
                        experimental_transform: smoothStream({
                            chunking: 'word',
                            delayInMs: 3,
                        }),
                        abortSignal: controller.signal,
                        providerOptions: {
                            openai,
                            google,
                            anthropic,
                            gateway: {
                                order: ['groq', 'cerebras'],
                            },
                        },
                        tools: tools as any,
                        onError: error => {
                            console.error('[API] Error in stream', error);
                            writer.write({
                                type: 'data-error',
                                data: 'Error generating response',
                            });
                        },
                    });

                    result.consumeStream();
                    writer.merge(
                        result.toUIMessageStream({
                            sendReasoning: true,
                            messageMetadata: ({ part }) => {
                                if (part.type === 'reasoning-start') {
                                    writer.write({
                                        type: 'data-reasoning-time',
                                        data: {
                                            id: part.id,
                                            type: 'start',
                                            timestamp: new Date().getTime(),
                                        },
                                    });
                                }
                                if (part.type === 'reasoning-end') {
                                    writer.write({
                                        type: 'data-reasoning-time',
                                        data: {
                                            id: part.id,
                                            type: 'end',
                                            timestamp: new Date().getTime(),
                                        },
                                    });
                                }
                                if (part.type === 'start') {
                                    return {
                                        model: {
                                            id: model.modelId,
                                            name: model.name,
                                            icon: model.icon,
                                        },
                                    };
                                }
                            },
                        })
                    );
                },
            });

            // Convert to SSE stream
            const sseStream = stream.pipeThrough(new JsonToSseTransformStream());

            console.log('[API] Creating resumable stream');
            const resumableStream = await createResumableStream(streamId, sseStream);

            // Generate thread title in background if needed
            if (!context.thread?.title) {
                generateThreadTitle(convexClient, threadId, body.message).catch(error =>
                    console.error('[API] Error generating thread title', error)
                );
            }

            // Increment usage in background
            incrementUsage(convexClient, session.user.id as Id<'users'>, 'credits', model.credits).catch(
                error => console.error('[API] Error incrementing usage', error)
            );

            return new Response(resumableStream, {
                headers: {
                    'Content-Type': 'text/event-stream',
                    'Cache-Control': 'no-cache',
                    Connection: 'keep-alive',
                },
            });
        } catch (error: any) {
            console.error('[API] Error in thread POST', error);
            return new Response(error.message || 'Internal server error', {
                status: error.status || 500,
            });
        }
    },
});
