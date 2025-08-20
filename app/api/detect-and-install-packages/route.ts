import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

const ENABLED = process.env.ENABLE_DETECT_INSTALL === 'true';

export async function POST(request: NextRequest) {
  if (!ENABLED) {
    return NextResponse.json(
      { success: false, error: 'detect-and-install-packages is disabled on this deployment (set ENABLE_DETECT_INSTALL=true to enable).' },
      { status: 501 }
    );
  }
  // Minimal placeholder response
  return NextResponse.json({ success: true, message: 'Detect & install endpoint enabled placeholder.' });
}
