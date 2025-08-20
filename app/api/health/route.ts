import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET() {
	try {
		const now = new Date().toISOString();
		const providers = {
			openai: Boolean(process.env.OPENAI_API_KEY),
			anthropic: Boolean(process.env.ANTHROPIC_API_KEY),
			gemini: Boolean(process.env.GEMINI_API_KEY),
			groq: Boolean(process.env.GROQ_API_KEY),
		};

		const flags = {
			enableApplyStream: process.env.ENABLE_APPLY_AI_CODE_STREAM === 'true',
			enableDetectInstall: process.env.ENABLE_DETECT_INSTALL === 'true',
		};

		return NextResponse.json({
			success: true,
			app: 'open-lovable',
			version: '0.1.0',
			timestamp: now,
			providers,
			flags,
		});
	} catch (error) {
		return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
	}
}

