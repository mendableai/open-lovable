import { NextRequest, NextResponse } from 'next/server';
import { streamChat, ChatMessage } from '@/lib/ai/openai';

// Opt into the Edge runtime.  This allows streaming responses with low
// latency and keeps dependencies out of the Node.js layer.
export const runtime = 'edge';

/**
 * POST /api/ai/chat
 *
 * Accepts a JSON body containing a list of chat messages and optional model
 * configuration.  Invokes the OpenAI chat completion API and streams the
 * assistant's response back as raw text.  If another AI provider is
 * configured via AI_PROVIDER, a 400 will be returned.
 */
export async function POST(req: NextRequest) {
  try {
    const { messages, model, temperature } = await req.json();

    // Basic validation
    if (!Array.isArray(messages)) {
      return NextResponse.json({ success: false, error: 'messages must be an array' }, { status: 400 });
    }

    // Only support openai provider for now
    const provider = process.env.AI_PROVIDER || 'openai';
    if (provider !== 'openai') {
      return NextResponse.json({ success: false, error: `Unsupported AI provider: ${provider}` }, { status: 400 });
    }

    // Call OpenAI and forward the response
    const response = await streamChat({
      messages: messages as ChatMessage[],
      model,
      temperature,
    });

    if (!response.ok || !response.body) {
      let errorMessage: string;
      try {
        const data = await response.json();
        errorMessage = data?.error?.message || response.statusText;
      } catch {
        errorMessage = response.statusText;
      }
      return NextResponse.json({ success: false, error: errorMessage }, { status: response.status });
    }

    // Transform OpenAI's SSE stream into raw text
    const encoder = new TextEncoder();
    const openaiStream = response.body;
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const reader = openaiStream!.getReader();
        const decoder = new TextDecoder('utf-8');
        let buffer = '';
        const push = (text: string) => {
          controller.enqueue(encoder.encode(text));
        };
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith('data:')) continue;
            const payload = trimmed.replace(/^data:\s*/, '');
            if (payload === '[DONE]') {
              controller.close();
              return;
            }
            try {
              const parsed = JSON.parse(payload);
              const delta: string = parsed.choices?.[0]?.delta?.content ?? '';
              if (delta) {
                push(delta);
              }
            } catch {
              // Skip malformed lines
            }
          }
        }
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
      },
    });
  } catch (err) {
    console.error('[api/ai/chat] Error:', err);
    return NextResponse.json({ success: false, error: (err as Error)?.message || 'Internal error' }, { status: 500 });
  }
}
