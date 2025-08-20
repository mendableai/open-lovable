import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

declare global {
  var viteErrors: any[];
}

// Initialize global viteErrors array if it doesn't exist
if (!globalThis.viteErrors) {
  globalThis.viteErrors = [];
}

export async function POST(request: NextRequest) {
  try {
    const { error, file, type = 'runtime-error' } = await request.json();
    
    if (!error) {
      return NextResponse.json({ 
        success: false, 
        error: 'Error message is required' 
      }, { status: 400 });
    }
    
    // Parse the error to extract useful information
    const errorObj: any = {
      type,
      message: error,
      file: file || 'unknown',
      timestamp: new Date().toISOString()
    };
    
    // Extract import information if it's an import error
    const importMatch = error.match(/Failed to resolve import ['"]([^'"]+)['"] from ['"]([^'"]+)['"]/);
    if (importMatch) {
      errorObj.type = 'import-error';
      errorObj.import = importMatch[1];
      errorObj.file = importMatch[2];
    }
    
    // Add to global errors array
    globalThis.viteErrors.push(errorObj);
    
    // Keep only last 50 errors
    if (globalThis.viteErrors.length > 50) {
      globalThis.viteErrors = globalThis.viteErrors.slice(-50);
    }
    
    console.log('[report-vite-error] Error reported:', errorObj);
    
    return NextResponse.json({
      success: true,
      message: 'Error reported successfully',
      error: errorObj
    });
    
  } catch (error) {
    console.error('[report-vite-error] Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: (error as Error).message 
    }, { status: 500 });
  }
}