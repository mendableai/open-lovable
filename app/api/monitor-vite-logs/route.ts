import { NextResponse } from 'next/server';

export const runtime = 'edge';

declare global {
  var activeSandbox: any;
}

export async function GET() {
  try {
    if (!globalThis.activeSandbox) {
      return NextResponse.json({ 
        success: false, 
        error: 'No active sandbox' 
      }, { status: 400 });
    }
    
    console.log('[monitor-vite-logs] Checking Vite process logs...');
    
    // Check both the error file and recent logs
    const result = await globalThis.activeSandbox.runCode(`
import json
import subprocess
import re

errors = []

# First check the error file
try:
    with open('/tmp/vite-errors.json', 'r') as f:
        data = json.load(f)
        errors.extend(data.get('errors', []))
except:
    pass

# Also check if we can get recent Vite logs
try:
    # Try to get the Vite process PID
    with open('/tmp/vite-process.pid', 'r') as f:
        pid = int(f.read().strip())
    
    # Check if process is still running and get its logs
    # This is a bit hacky but works for our use case
    result = subprocess.run(['ps', '-p', str(pid)], capture_output=True, text=True)
    if result.returncode == 0:
        # Process is running, try to check for errors in output
        # Note: We can't easily get stdout/stderr from a running process
        # but we can check if there are new errors
        pass
except:
    pass

# Also scan the current console output for any HMR errors
# This won't catch everything but helps with recent errors
try:
    # Check if there's a log file we can read
    import os
    log_files = []
    for root, dirs, files in os.walk('/tmp'):
        for file in files:
            if 'vite' in file.lower() and file.endswith('.log'):
                log_files.append(os.path.join(root, file))
    
    for log_file in log_files[:5]:  # Check up to 5 log files
        try:
            with open(log_file, 'r') as f:
                content = f.read()
                # Look for import errors
                import_errors = re.findall(r'Failed to resolve import "([^"]+)"', content)
                for pkg in import_errors:
                    if not pkg.startswith('.'):
                        # Extract base package name
                        if pkg.startswith('@'):
                            parts = pkg.split('/')
                            final_pkg = '/'.join(parts[:2]) if len(parts) >= 2 else pkg
                        else:
                            final_pkg = pkg.split('/')[0]
                        
                        error_obj = {
                            "type": "npm-missing",
                            "package": final_pkg,
                            "message": f"Failed to resolve import \\"{pkg}\\"",
                            "file": "Unknown"
                        }
                        
                        # Avoid duplicates
                        if not any(e['package'] == error_obj['package'] for e in errors):
                            errors.append(error_obj)
        except:
            pass
except Exception as e:
    print(f"Error scanning logs: {e}")

# Deduplicate errors
unique_errors = []
seen_packages = set()
for error in errors:
    if error.get('package') and error['package'] not in seen_packages:
        seen_packages.add(error['package'])
        unique_errors.append(error)

print(json.dumps({"errors": unique_errors}))
    `, { timeout: 5000 });
    
    const data = JSON.parse(result.output || '{"errors": []}');
    
    return NextResponse.json({
      success: true,
      hasErrors: data.errors.length > 0,
      errors: data.errors
    });
    
  } catch (error) {
    console.error('[monitor-vite-logs] Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: (error as Error).message 
    }, { status: 500 });
  }
}