import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

// Initialize AI clients
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { 
      prompt, 
      model = 'gpt-4', 
      files, 
      context,
      stream = true 
    } = await request.json();

    // Determine which AI service to use
    const isOpenAI = model.startsWith('gpt-');
    const isAnthropic = model.startsWith('claude-');

    if (!isOpenAI && !isAnthropic) {
      return NextResponse.json(
        { error: 'Unsupported model' },
        { status: 400 }
      );
    }

    // Build context from files
    const fileContext = files ? buildFileContext(files) : '';
    
    // Build system prompt
    const systemPrompt = buildSystemPrompt(fileContext, context);

    if (stream) {
      return await streamCodeGeneration(prompt, systemPrompt, model, isOpenAI);
    } else {
      return await generateCodeNonStreaming(prompt, systemPrompt, model, isOpenAI);
    }

  } catch (error) {
    console.error('Code Generation API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate code' },
      { status: 500 }
    );
  }
}

function buildFileContext(files: Record<string, string>): string {
  let context = '\n\n## Current Project Files:\n';
  
  for (const [path, content] of Object.entries(files)) {
    context += `\n### ${path}\n\`\`\`\n${content}\n\`\`\`\n`;
  }
  
  return context;
}

function buildSystemPrompt(fileContext: string, context?: string): string {
  return `You are an expert AI coding assistant specializing in generating complete, functional code for web applications.

${context || ''}

You have access to the current project files:${fileContext}

When generating code:
1. Always provide complete, working code files
2. Include all necessary imports and dependencies
3. Use modern JavaScript/TypeScript best practices
4. Ensure code is immediately runnable
5. Include proper error handling
6. Add helpful comments for complex logic
7. Follow the existing code style and patterns

Generate code that can be directly applied to the sandbox environment. Be specific about file paths and ensure all dependencies are properly declared.`;
}

async function streamCodeGeneration(
  prompt: string, 
  systemPrompt: string, 
  model: string, 
  isOpenAI: boolean
) {
  const encoder = new TextEncoder();

  if (isOpenAI) {
    const stream = await openai.chat.completions.create({
      model: model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 4000,
      stream: true,
    });

    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
            }
          }
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } else {
    // Anthropic streaming
    const stream = await anthropic.messages.create({
      model: model,
      max_tokens: 4000,
      messages: [
        { role: 'user', content: `${systemPrompt}\n\nHuman: ${prompt}` }
      ],
      temperature: 0.7,
      stream: true,
    });

    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            if (chunk.type === 'content_block_delta') {
              const content = chunk.delta.text;
              if (content) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
              }
            }
          }
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  }
}

async function generateCodeNonStreaming(
  prompt: string, 
  systemPrompt: string, 
  model: string, 
  isOpenAI: boolean
) {
  let response;
  
  if (isOpenAI) {
    response = await openai.chat.completions.create({
      model: model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 4000,
      stream: false,
    });
  } else {
    response = await anthropic.messages.create({
      model: model,
      max_tokens: 4000,
      messages: [
        { role: 'user', content: `${systemPrompt}\n\nHuman: ${prompt}` }
      ],
      temperature: 0.7,
    });
  }

  const content = isOpenAI 
    ? response.choices[0].message.content
    : response.content[0].text;

  return NextResponse.json({
    success: true,
    content: content,
    model: model,
    usage: isOpenAI ? response.usage : null
  });
}