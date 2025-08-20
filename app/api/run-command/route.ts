import { NextRequest, NextResponse } from 'next/server';
// import { Sandbox } from '@e2b/code-interpreter';

export const runtime = 'edge';

// Get active sandbox from global state (in production, use a proper state management solution)
declare global {
  var activeSandbox: any;
}

export async function POST(request: NextRequest) {
  try {
    const { command } = await request.json();
    
    if (!command) {
      return NextResponse.json({ 
        success: false, 
        error: 'Command is required' 
      }, { status: 400 });
    }
    
    if (!globalThis.activeSandbox) {
      return NextResponse.json({ 
        success: false, 
        error: 'No active sandbox' 
      }, { status: 400 });
    }
    
    console.log(`[run-command] Executing: ${command}`);
    
    const result = await globalThis.activeSandbox.runCode(`
import subprocess
import os

os.chdir('/home/user/app')
result = subprocess.run(${JSON.stringify(command.split(' '))}, 
                       capture_output=True, 
                       text=True, 
                       shell=False)

print("STDOUT:")
print(result.stdout)
if result.stderr:
    print("\\nSTDERR:")
    print(result.stderr)
print(f"\\nReturn code: {result.returncode}")
    `);
    
    const output = result.logs.stdout.join('\n');
    
    return NextResponse.json({
      success: true,
      output,
      message: 'Command executed successfully'
    });
    
  } catch (error) {
    console.error('[run-command] Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: (error as Error).message 
    }, { status: 500 });
  }
}