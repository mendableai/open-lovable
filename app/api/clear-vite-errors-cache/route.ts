import { NextResponse } from 'next/server';

export const runtime = 'edge';

declare global {
  var viteErrorsCache: { errors: any[], timestamp: number } | null;
}

export async function POST() {
  try {
    // Clear the cache
    globalThis.viteErrorsCache = null;
    
    console.log('[clear-vite-errors-cache] Cache cleared');
    
    return NextResponse.json({
      success: true,
      message: 'Vite errors cache cleared'
    });
    
  } catch (error) {
    console.error('[clear-vite-errors-cache] Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: (error as Error).message 
    }, { status: 500 });
  }
}