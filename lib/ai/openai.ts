/**
 * Minimal OpenAI client for StarStack.
 *
 * This module reads configuration from environment variables and exposes a
 * helper that performs chat completions with streaming support.  It is
 * deliberately small and self‑contained to avoid pulling heavy dependencies
 * into the Edge runtime.
 *
 * Expected environment variables:
 *  - AI_PROVIDER: when set to "openai" this client will be used.  Other
 *    values are ignored.
 *  - OPENAI_API_KEY: your OpenAI API key (required).
 *  - OPENAI_MODEL: optional override of the default model.  If absent the
 *    fallback is "gpt-4o-mini" to align with the project default.
 *  - OPENAI_BASE_URL: optional override for the API base URL.  When unset
 *    the standard https://api.openai.com/v1 endpoint is used.
 */

/**
 * Chat message interface compatible with OpenAI's API.
 */
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | string;
  content: string;
}

/**
 * Returns the currently configured OpenAI model.  Falls back to
 * `gpt-4o-mini` if no override is provided.
 */
export function getDefaultModel(): string {
  return process.env.OPENAI_MODEL || 'gpt-5';
}

/**
 * Internal helper that constructs the full API URL.  Allows overriding the
 * base via OPENAI_BASE_URL while falling back to the public OpenAI API.
 */
function buildUrl(path: string): string {
  const base = (process.env.OPENAI_BASE_URL?.replace(/\/+$/, '') ||
    'https://api.openai.com/v1');
  return `${base}${path.startsWith('/') ? '' : '/'}${path}`;
}

/**
 * Performs a chat completion request against the OpenAI API and returns the
 * streaming Response.  The returned Response can be piped directly to a
 * Next.js API route or consumed manually.
 *
 * @param messages The chat history.  Each message must include a `role`
 *        ("system" | "user" | "assistant") and `content` string.
 * @param model Optional model override.  Defaults to getDefaultModel().
 * @param temperature Optional sampling temperature.  Defaults to 0.5.
 */
export async function streamChat({
  messages,
  model,
  temperature,
}: {
  messages: ChatMessage[];
  model?: string;
  temperature?: number;
}): Promise<Response> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('Missing OPENAI_API_KEY');
  }
  const resolvedModel = model || getDefaultModel();

  return fetch(buildUrl('/chat/completions'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: resolvedModel,
      messages,
      temperature: typeof temperature === 'number' ? temperature : 0.5,
      stream: true,
    }),
  });
}
