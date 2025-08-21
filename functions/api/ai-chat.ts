// Cloudflare Pages Function for Advanced AI Chat API
// Complete implementation with context awareness, conversation history, and file support

import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

interface Env {
  OPENAI_API_KEY: string;
  ANTHROPIC_API_KEY: string;
  GROQ_API_KEY?: string;
  AI_CONTEXT_DB?: string; // Cloudflare D1 database binding (if available)
}

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: string;
  files?: Array<{ name: string; content: string; type: string }>;
}

interface ConversationContext {
  conversationId?: string;
  history: ChatMessage[];
  projectFiles?: Record<string, string>;
  currentProject?: string;
  sandboxId?: string;
  preferences?: {
    language: 'ar' | 'en';
    codeStyle: 'modern' | 'conservative';
    responseLength: 'concise' | 'detailed';
  };
}

// Enhanced system prompts for different contexts
const SYSTEM_PROMPTS = {
  coding: {
    ar: `أنت مطور ذكي متخصص في JavaScript, TypeScript, React, و Next.js. تتحدث العربية بطلاقة.

قواعد مهمة:
- اكتب كود نظيف وقابل للصيانة
- استخدم أفضل الممارسات الحديثة
- اشرح الكود المعقد
- تأكد من أن الكود يعمل فعلياً
- ركز على الأمان والأداء
- استخدم TypeScript عندما أمكن

عندما تولد كود، ضعه في علامات:
<file path="path/to/file.js">
// الكود هنا
</file>`,
    en: `You are an expert developer specializing in JavaScript, TypeScript, React, and Next.js.

Important rules:
- Write clean, maintainable code
- Use modern best practices
- Explain complex code
- Ensure code actually works
- Focus on security and performance
- Use TypeScript when possible

When generating code, wrap it in:
<file path="path/to/file.js">
// code here
</file>`
  },
  general: {
    ar: `أنت مساعد ذكي متخصص في تطوير المواقع والتطبيقات. تجيب باللغة العربية وتساعد في:
- البرمجة وتطوير المواقع
- حل المشاكل التقنية
- تحسين الأداء
- أفضل الممارسات

كن دقيق، واضح، ومفيد في إجاباتك.`,
    en: `You are an intelligent assistant specialized in web and app development. You help with:
- Programming and web development
- Solving technical problems  
- Performance optimization
- Best practices

Be precise, clear, and helpful in your responses.`
  }
};

export async function onRequestPost(context: { request: Request; env: Env }) {
  const { request, env } = context;

  try {
    const requestData = await request.json();
    const { 
      message, 
      model = 'gpt-4',
      context: conversationContext,
      stream = false,
      temperature = 0.7,
      maxTokens = 4000
    }: {
      message: string;
      model?: string;
      context?: ConversationContext;
      stream?: boolean;
      temperature?: number;
      maxTokens?: number;
    } = requestData;

    if (!message) {
      return new Response(
        JSON.stringify({ error: 'Message is required' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Build conversation history with context
    const messages = await buildConversationMessages(message, conversationContext, env);
    
    let response: string | ReadableStream;

    if (model.startsWith('claude')) {
      response = await handleAnthropicRequest(messages, model, env, { temperature, maxTokens, stream });
    } else if (model.startsWith('groq:') && env.GROQ_API_KEY) {
      response = await handleGroqRequest(messages, model.replace('groq:', ''), env, { temperature, maxTokens, stream });
    } else {
      response = await handleOpenAIRequest(messages, model, env, { temperature, maxTokens, stream });
    }

    if (stream && response instanceof ReadableStream) {
      return new Response(response, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        }
      });
    }

    // Save conversation to context (if D1 is available)
    if (conversationContext?.conversationId && env.AI_CONTEXT_DB) {
      await saveConversationContext(conversationContext.conversationId, {
        ...conversationContext,
        history: [...(conversationContext.history || []), 
          { role: 'user', content: message, timestamp: new Date().toISOString() },
          { role: 'assistant', content: response as string, timestamp: new Date().toISOString() }
        ]
      }, env);
    }

    return new Response(
      JSON.stringify({ 
        response: response as string,
        model,
        timestamp: new Date().toISOString(),
        conversationId: conversationContext?.conversationId || generateConversationId(),
        tokensUsed: estimateTokens(message + (response as string)),
        context: {
          hasFiles: !!conversationContext?.projectFiles,
          fileCount: Object.keys(conversationContext?.projectFiles || {}).length,
          sandboxConnected: !!conversationContext?.sandboxId
        }
      }),
      {
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        }
      }
    );

  } catch (error) {
    console.error('AI Chat error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to process AI request',
        details: error instanceof Error ? error.message : 'Unknown error',
        type: error instanceof Error ? error.constructor.name : 'UnknownError',
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      }
    );
  }
}

// Helper Functions

async function buildConversationMessages(
  message: string, 
  context?: ConversationContext,
  env?: Env
): Promise<ChatMessage[]> {
  const messages: ChatMessage[] = [];
  
  // Add system prompt based on context
  const isArabic = context?.preferences?.language === 'ar' || /[؀-ۿ]/.test(message);
  const isCoding = message.toLowerCase().includes('code') || 
                   message.includes('function') || 
                   message.includes('component') ||
                   /[كود|برمجة|دالة|مكون]/.test(message);
  
  const systemPrompt = isCoding 
    ? SYSTEM_PROMPTS.coding[isArabic ? 'ar' : 'en']
    : SYSTEM_PROMPTS.general[isArabic ? 'ar' : 'en'];
    
  messages.push({ role: 'system', content: systemPrompt });
  
  // Add conversation history
  if (context?.history && context.history.length > 0) {
    // Keep last 10 messages to avoid token limit
    const recentHistory = context.history.slice(-10);
    messages.push(...recentHistory);
  }
  
  // Add project files context if available
  if (context?.projectFiles && Object.keys(context.projectFiles).length > 0) {
    const filesContext = Object.entries(context.projectFiles)
      .slice(0, 5) // Limit to 5 files to avoid token limit
      .map(([path, content]) => `File: ${path}\n\`\`\`\n${content.slice(0, 1000)}\n\`\`\``)
      .join('\n\n');
      
    messages.push({
      role: 'system',
      content: `Project Context - Current Files:\n\n${filesContext}`
    });
  }
  
  // Add sandbox context if available
  if (context?.sandboxId) {
    messages.push({
      role: 'system',
      content: `Active Sandbox: ${context.sandboxId}\nYou can create, modify, and execute code in this sandbox.`
    });
  }
  
  // Add current message
  messages.push({ role: 'user', content: message });
  
  return messages;
}

async function handleOpenAIRequest(
  messages: ChatMessage[],
  model: string,
  env: Env,
  options: { temperature: number; maxTokens: number; stream: boolean }
): Promise<string | ReadableStream> {
  const openai = new OpenAI({
    apiKey: env.OPENAI_API_KEY,
  });

  if (options.stream) {
    const stream = await openai.chat.completions.create({
      model: model as any,
      messages: messages.map(m => ({ role: m.role, content: m.content })) as any,
      temperature: options.temperature,
      max_tokens: options.maxTokens,
      stream: true,
    } as any);

    return new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
              controller.enqueue(`data: ${JSON.stringify({ content, done: false })}\n\n`);
            }
          }
          controller.enqueue(`data: ${JSON.stringify({ content: '', done: true })}\n\n`);
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      }
    });
  }

  const result = await openai.chat.completions.create({
    model: model,
    messages: messages.map(m => ({ role: m.role, content: m.content })),
    temperature: options.temperature,
    max_tokens: options.maxTokens,
  });

  return result.choices[0]?.message?.content || 'No response generated';
}

async function handleAnthropicRequest(
  messages: ChatMessage[],
  model: string,
  env: Env,
  options: { temperature: number; maxTokens: number; stream: boolean }
): Promise<string | ReadableStream> {
  const anthropic = new Anthropic({
    apiKey: env.ANTHROPIC_API_KEY,
  });

  // Convert messages format for Anthropic
  const systemMessage = messages.find(m => m.role === 'system')?.content || '';
  const conversationMessages = messages
    .filter(m => m.role !== 'system')
    .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }));

  if (options.stream) {
    const stream = await anthropic.messages.create({
      model: model.replace('claude-', 'claude-3-sonnet-') || 'claude-3-sonnet-20240229',
      max_tokens: options.maxTokens,
      temperature: options.temperature,
      system: systemMessage,
      messages: conversationMessages,
      stream: true,
    });

    return new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
              controller.enqueue(`data: ${JSON.stringify({ content: chunk.delta.text, done: false })}\n\n`);
            }
          }
          controller.enqueue(`data: ${JSON.stringify({ content: '', done: true })}\n\n`);
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      }
    });
  }

  const result = await anthropic.messages.create({
    model: model.replace('claude-', 'claude-3-sonnet-') || 'claude-3-sonnet-20240229',
    max_tokens: options.maxTokens,
    temperature: options.temperature,
    system: systemMessage,
    messages: conversationMessages,
  });

  return result.content[0]?.type === 'text' ? result.content[0].text : 'No response generated';
}

async function handleGroqRequest(
  messages: ChatMessage[],
  model: string,
  env: Env,
  options: { temperature: number; maxTokens: number; stream: boolean }
): Promise<string | ReadableStream> {
  // Groq API is OpenAI compatible
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: model || 'mixtral-8x7b-32768',
      messages: messages.map(m => ({ role: m.role, content: m.content })),
      temperature: options.temperature,
      max_tokens: options.maxTokens,
      stream: options.stream,
    }),
  });

  if (!response.ok) {
    throw new Error(`Groq API error: ${response.statusText}`);
  }

  if (options.stream) {
    return response.body!;
  }

  const result = await response.json();
  return result.choices[0]?.message?.content || 'No response generated';
}

async function saveConversationContext(
  conversationId: string,
  context: ConversationContext,
  env: Env
): Promise<void> {
  // Save to Cloudflare D1 if available
  if (env.AI_CONTEXT_DB) {
    try {
      const db = env.AI_CONTEXT_DB as any; // D1 Database binding
      await db.prepare(`
        INSERT OR REPLACE INTO conversations (id, context, updated_at)
        VALUES (?, ?, ?)
      `).bind(
        conversationId,
        JSON.stringify(context),
        new Date().toISOString()
      ).run();
    } catch (error) {
      console.error('Failed to save conversation context:', error);
    }
  }
}

function generateConversationId(): string {
  return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function estimateTokens(text: string): number {
  // Rough estimation: ~4 characters per token
  return Math.ceil(text.length / 4);
}

// Handle CORS preflight requests
export async function onRequestOptions() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}