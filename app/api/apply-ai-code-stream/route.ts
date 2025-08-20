import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

// Gate with env flag so we can re-enable after deployment without code edits
const ENABLED = process.env.ENABLE_APPLY_AI_CODE_STREAM === 'true';

export async function POST(_: NextRequest) {
  if (!ENABLED) {
    return NextResponse.json(
      { success: false, error: 'apply-ai-code-stream is disabled on this deployment (set ENABLE_APPLY_AI_CODE_STREAM=true to enable).' },
      { status: 501 }
    );
  }
  return NextResponse.json({ success: true, message: 'Streaming endpoint enabled placeholder.' });
}

export async function GET() {
  return NextResponse.json({ ok: true, enabled: ENABLED });
}
