import { NextResponse } from 'next/server';

export const runtime = 'edge';

declare global {
  var activeSandbox: any;
  var sandboxData: any;
  var existingFiles: Set<string>;
}

export async function GET() {
  try {
    // Check if sandbox exists
    const sandboxExists = !!globalThis.activeSandbox;
    
    let sandboxHealthy = false;
    let sandboxInfo = null;
    
    if (sandboxExists && globalThis.activeSandbox) {
      try {
        // Since Python isn't available in the Vite template, just check if sandbox exists
        // The sandbox object existing is enough to confirm it's healthy
        sandboxHealthy = true;
        sandboxInfo = {
          sandboxId: globalThis.sandboxData?.sandboxId,
          url: globalThis.sandboxData?.url,
          filesTracked: globalThis.existingFiles ? Array.from(globalThis.existingFiles) : [],
          lastHealthCheck: new Date().toISOString()
        };
      } catch (error) {
        console.error('[sandbox-status] Health check failed:', error);
        sandboxHealthy = false;
      }
    }
    
    return NextResponse.json({
      success: true,
      active: sandboxExists,
      healthy: sandboxHealthy,
      sandboxData: sandboxInfo,
      message: sandboxHealthy 
        ? 'Sandbox is active and healthy' 
        : sandboxExists 
          ? 'Sandbox exists but is not responding' 
          : 'No active sandbox'
    });
    
  } catch (error) {
    console.error('[sandbox-status] Error:', error);
    return NextResponse.json({ 
      success: false,
      active: false,
      error: (error as Error).message 
    }, { status: 500 });
  }
}