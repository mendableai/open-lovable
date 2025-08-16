import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET() {
  // Report health for each external service separately
  const services: Record<string, any> = {};
  const provider = process.env.AI_PROVIDER || 'openai';

  // Check OpenAI only if it’s the configured provider
  if (provider === 'openai') {
    const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      services.openai = { ok: false, model, error: 'Missing OPENAI_API_KEY' };
    } else {
      try {
        const baseUrl =
          process.env.OPENAI_BASE_URL?.replace(/\/+$/, '') ||
          'https://api.openai.com/v1';
        const res = await fetch(`${baseUrl}/models`, {
          headers: { Authorization: `Bearer ${apiKey}` },
        });
        if (res.ok) {
          services.openai = { ok: true, model };
        } else {
          let errorMessage: string;
          try {
            const data = await res.json();
            errorMessage = data?.error?.message || res.statusText;
          } catch {
            errorMessage = res.statusText;
          }
          services.openai = { ok: false, model, error: errorMessage };
        }
      } catch (err) {
        services.openai = {
          ok: false,
          model,
          error: (err as Error).message,
        };
      }
    }
  }

  // Firecrawl status: key present → ok = true; missing → ok = false
  const firecrawlKey = process.env.FIRECRAWL_API_KEY;
  services.firecrawl = firecrawlKey
    ? { ok: true }
    : { ok: false, error: 'Missing FIRECRAWL_API_KEY' };

  // E2B status: key present → ok = true; missing → ok = false
  const e2bKey = process.env.E2B_API_KEY;
  services.e2b = e2bKey
    ? { ok: true }
    : { ok: false, error: 'Missing E2B_API_KEY' };

  // Overall status is "ok" only if all services report ok = true
  const status = Object.values(services).every((svc: any) => svc?.ok)
    ? 'ok'
    : 'error';
  return NextResponse.json({ status, services });
}
