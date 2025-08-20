import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

declare global {
  var activeSandbox: any;
}

export async function GET(_: NextRequest) {
  try {
    if (!globalThis.activeSandbox) {
      return NextResponse.json({ 
        success: false, 
        error: 'No active sandbox' 
      }, { status: 400 });
    }
    
    console.log('[sandbox-logs] Fetching Vite dev server logs...');
    
    // Get the last N lines of the Vite dev server output
    const result = await globalThis.activeSandbox.runCode(`
import subprocess
import os

# Try to get the Vite process output
try:
    # Read the last 100 lines of any log files
    log_content = []
    
    # Check if there are any node processes running
    ps_result = subprocess.run(['ps', 'aux'], capture_output=True, text=True)
    vite_processes = [line for line in ps_result.stdout.split('\\n') if 'vite' in line.lower()]
    
    if vite_processes:
        log_content.append("Vite is running")
    else:
        log_content.append("Vite process not found")
    
    # Try to capture recent console output (this is a simplified approach)
    # In a real implementation, you'd want to capture the Vite process output directly
    print(json.dumps({
        "hasErrors": False,
        "logs": log_content,
        "status": "running" if vite_processes else "stopped"
    }))
except Exception as e:
    print(json.dumps({
        "hasErrors": True,
        "logs": [str(e)],
        "status": "error"
    }))
    `);
    
    try {
      const logData = JSON.parse(result.output || '{}');
      return NextResponse.json({
        success: true,
        ...logData
      });
    } catch {
      return NextResponse.json({
        success: true,
        hasErrors: false,
        logs: [result.output],
        status: 'unknown'
      });
    }
    
  } catch (error) {
    console.error('[sandbox-logs] Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: (error as Error).message 
    }, { status: 500 });
  }
}