import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { log } from '@/lib/logger';

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
      message, 
      model = 'gpt-4', 
      sandboxId, 
      files, 
      conversationHistory,
      systemPrompt 
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

    // Build context from sandbox files
    const fileContext = files ? buildFileContext(files) : '';
    
    // Build conversation context
    const messages = buildConversationMessages(
      message,
      systemPrompt,
      fileContext,
      conversationHistory,
      isOpenAI
    );

    let response;
    if (isOpenAI) {
      response = await openai.chat.completions.create({
        model: model,
        messages: messages,
        temperature: 0.7,
        max_tokens: 4000,
        stream: false,
      });
    } else {
      response = await anthropic.messages.create({
        model: model,
        max_tokens: 4000,
        messages: messages,
        temperature: 0.7,
      });
    }

    const aiResponse = isOpenAI 
      ? response.choices[0].message.content
      : response.content[0].text;

    return NextResponse.json({
      success: true,
      response: aiResponse,
      model: model,
      usage: isOpenAI ? response.usage : null
    });

  } catch (error) {
    log.error('AI Chat API error', 'ai-chat', { error });
    return NextResponse.json(
      { error: 'Failed to generate AI response' },
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

function buildConversationMessages(
  userMessage: string,
  systemPrompt: string,
  fileContext: string,
  conversationHistory: any[],
  isOpenAI: boolean
) {
  const baseSystemPrompt = `You are an expert AI coding assistant. You help users build and modify web applications in real-time sandbox environments.

${systemPrompt || ''}

You have access to the current project files and can:
- Generate new code files
- Modify existing files
- Install packages
- Provide code explanations
- Debug issues
- Suggest improvements

Always provide practical, working code that can be immediately applied to the sandbox.${fileContext}

Respond in a helpful, professional manner. When generating code, be specific about file paths and ensure the code is complete and functional.`;

  const messages = [];

  if (isOpenAI) {
    messages.push({
      role: 'system',
      content: baseSystemPrompt
    });

    // Add conversation history
    for (const msg of conversationHistory) {
      messages.push({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.content
      });
    }

    messages.push({
      role: 'user',
      content: userMessage
    });
  } else {
    // Anthropic format
    messages.push({
      role: 'user',
      content: `${baseSystemPrompt}\n\nConversation History:\n${conversationHistory.map(msg => 
        `${msg.type === 'user' ? 'Human' : 'Assistant'}: ${msg.content}`
      ).join('\n')}\n\nHuman: ${userMessage}`
    });
  }

  return messages;
}