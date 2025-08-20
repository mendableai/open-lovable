import { NextRequest, NextResponse } from 'next/server';
import { Sandbox } from '@e2b/code-interpreter';

export const runtime = 'edge';

declare global {
  var activeSandbox: any;
  var sandboxData: any;
}

export async function POST(request: NextRequest) {
  try {
    const { packages, sandboxId } = await request.json();
    
    if (!packages || !Array.isArray(packages) || packages.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Packages array is required' 
      }, { status: 400 });
    }
    
    // Validate and deduplicate package names
    const validPackages = [...new Set(packages)]
      .filter(pkg => pkg && typeof pkg === 'string' && pkg.trim() !== '')
      .map(pkg => pkg.trim());
    
    if (validPackages.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No valid package names provided'
      }, { status: 400 });
    }
    
    // Log if duplicates were found
    if (packages.length !== validPackages.length) {
      console.log(`[install-packages] Cleaned packages: removed ${packages.length - validPackages.length} invalid/duplicate entries`);
      console.log(`[install-packages] Original:`, packages);
      console.log(`[install-packages] Cleaned:`, validPackages);
    }
    
    // Try to get sandbox - either from global or reconnect
    let sandbox = globalThis.activeSandbox;
    
    if (!sandbox && sandboxId) {
      console.log(`[install-packages] Reconnecting to sandbox ${sandboxId}...`);
      try {
        sandbox = await Sandbox.connect(sandboxId, { apiKey: process.env.E2B_API_KEY });
        globalThis.activeSandbox = sandbox;
        console.log(`[install-packages] Successfully reconnected to sandbox ${sandboxId}`);
      } catch (error) {
        console.error(`[install-packages] Failed to reconnect to sandbox:`, error);
        return NextResponse.json({ 
          success: false, 
          error: `Failed to reconnect to sandbox: ${(error as Error).message}` 
        }, { status: 500 });
      }
    }
    
    if (!sandbox) {
      return NextResponse.json({ 
        success: false, 
        error: 'No active sandbox available' 
      }, { status: 400 });
    }
    
    console.log('[install-packages] Installing packages:', packages);
    
    // Create a response stream for real-time updates
    const encoder = new TextEncoder();
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();
    
    // Function to send progress updates
    const sendProgress = async (data: any) => {
      const message = `data: ${JSON.stringify(data)}\n\n`;
      await writer.write(encoder.encode(message));
    };
    
    // Start installation in background
    (async (sandboxInstance) => {
      try {
        await sendProgress({ 
          type: 'start', 
          message: `Installing ${validPackages.length} package${validPackages.length > 1 ? 's' : ''}...`,
          packages: validPackages 
        });
        
        // Kill any existing Vite process first
        await sendProgress({ type: 'status', message: 'Stopping development server...' });
        
        await sandboxInstance.runCode(`
import subprocess
import os
import signal

# Try to kill any existing Vite process
try:
    with open('/tmp/vite-process.pid', 'r') as f:
        pid = int(f.read().strip())
        os.kill(pid, signal.SIGTERM)
        print("Stopped existing Vite process")
except:
    print("No existing Vite process found")
        `);
        
        // Check which packages are already installed
        await sendProgress({ 
          type: 'status', 
          message: 'Checking installed packages...' 
        });
        
        const checkResult = await sandboxInstance.runCode(`
import os
import json

os.chdir('/home/user/app')

# Read package.json to check installed packages
try:
    with open('package.json', 'r') as f:
        package_json = json.load(f)
    
    dependencies = package_json.get('dependencies', {})
    dev_dependencies = package_json.get('devDependencies', {})
    all_deps = {**dependencies, **dev_dependencies}
    
    # Check which packages need to be installed
    packages_to_check = ${JSON.stringify(validPackages)}
    already_installed = []
    need_install = []
    
    for pkg in packages_to_check:
        # Handle scoped packages
        if pkg.startswith('@'):
            pkg_name = pkg
        else:
            # Extract package name without version
            pkg_name = pkg.split('@')[0]
        
        if pkg_name in all_deps:
            already_installed.append(pkg_name)
        else:
            need_install.append(pkg)
    
    print(f"Already installed: {already_installed}")
    print(f"Need to install: {need_install}")
    print(f"NEED_INSTALL:{json.dumps(need_install)}")
    
except Exception as e:
    print(f"Error checking packages: {e}")
    print(f"NEED_INSTALL:{json.dumps(packages_to_check)}")
        `);
        
        // Parse packages that need installation
        let packagesToInstall = validPackages;
        
        // Check if checkResult has the expected structure
        if (checkResult && checkResult.results && checkResult.results[0] && checkResult.results[0].text) {
          const outputLines = checkResult.results[0].text.split('\n');
          for (const line of outputLines) {
            if (line.startsWith('NEED_INSTALL:')) {
              try {
                packagesToInstall = JSON.parse(line.substring('NEED_INSTALL:'.length));
              } catch (e) {
                console.error('Failed to parse packages to install:', e);
              }
            }
          }
        } else {
          console.error('[install-packages] Invalid checkResult structure:', checkResult);
          // If we can't check, just try to install all packages
          packagesToInstall = validPackages;
        }
        
        
        if (packagesToInstall.length === 0) {
          await sendProgress({ 
            type: 'success', 
            message: 'All packages are already installed',
            installedPackages: [],
            alreadyInstalled: validPackages
          });
          return;
        }
        
        // Install only packages that aren't already installed
        const packageList = packagesToInstall.join(' ');
        // Only send the npm install command message if we're actually installing new packages
        await sendProgress({ 
          type: 'info', 
          message: `Installing ${packagesToInstall.length} new package(s): ${packagesToInstall.join(', ')}`
        });
        
        const installResult = await sandboxInstance.runCode(`
import subprocess
import os

os.chdir('/home/user/app')

# Run npm install with output capture
packages_to_install = ${JSON.stringify(packagesToInstall)}
cmd_args = ['npm', 'install', '--legacy-peer-deps'] + packages_to_install

print(f"Running command: {' '.join(cmd_args)}")

process = subprocess.Popen(
    cmd_args,
    stdout=subprocess.PIPE,
    stderr=subprocess.PIPE,
    text=True
)

# Stream output
while True:
    output = process.stdout.readline()
    if output == '' and process.poll() is not None:
        break
    if output:
        print(output.strip())

# Get the return code
rc = process.poll()

# Capture any stderr
stderr = process.stderr.read()
if stderr:
    print("STDERR:", stderr)
    if 'ERESOLVE' in stderr:
        print("ERESOLVE_ERROR: Dependency conflict detected - using --legacy-peer-deps flag")

print(f"\\nInstallation completed with code: {rc}")

# Verify packages were installed
import json
with open('/home/user/app/package.json', 'r') as f:
    package_json = json.load(f)
    
installed = []
for pkg in ${JSON.stringify(packagesToInstall)}:
    if pkg in package_json.get('dependencies', {}):
        installed.append(pkg)
        print(f"✓ Verified {pkg}")
    else:
        print(f"✗ Package {pkg} not found in dependencies")
        
print(f"\\nVerified installed packages: {installed}")
        `, { timeout: 60000 }); // 60 second timeout for npm install
        
        // Send npm output
        const output = installResult?.output || installResult?.logs?.stdout?.join('\n') || '';
        const npmOutputLines = output.split('\n').filter((line: string) => line.trim());
        for (const line of npmOutputLines) {
          if (line.includes('STDERR:')) {
            const errorMsg = line.replace('STDERR:', '').trim();
            if (errorMsg && errorMsg !== 'undefined') {
              await sendProgress({ type: 'error', message: errorMsg });
            }
          } else if (line.includes('ERESOLVE_ERROR:')) {
            const msg = line.replace('ERESOLVE_ERROR:', '').trim();
            await sendProgress({ 
              type: 'warning', 
              message: `Dependency conflict resolved with --legacy-peer-deps: ${msg}` 
            });
          } else if (line.includes('npm WARN')) {
            await sendProgress({ type: 'warning', message: line });
          } else if (line.trim() && !line.includes('undefined')) {
            await sendProgress({ type: 'output', message: line });
          }
        }
        
        // Check if installation was successful
        const installedMatch = output.match(/Verified installed packages: \[(.*?)\]/);
        let installedPackages: string[] = [];
        
        if (installedMatch && installedMatch[1]) {
          installedPackages = installedMatch[1]
            .split(',')
            .map((p: string) => p.trim().replace(/'/g, ''))
            .filter((p: string) => p.length > 0);
        }
        
        if (installedPackages.length > 0) {
          await sendProgress({ 
            type: 'success', 
            message: `Successfully installed: ${installedPackages.join(', ')}`,
            installedPackages 
          });
        } else {
          await sendProgress({ 
            type: 'error', 
            message: 'Failed to verify package installation' 
          });
        }
        
        // Restart Vite dev server
        await sendProgress({ type: 'status', message: 'Restarting development server...' });
        
        await sandboxInstance.runCode(`
import subprocess
import os
import time

os.chdir('/home/user/app')

# Kill any existing Vite processes
subprocess.run(['pkill', '-f', 'vite'], capture_output=True)
time.sleep(1)

# Start Vite dev server
env = os.environ.copy()
env['FORCE_COLOR'] = '0'

process = subprocess.Popen(
    ['npm', 'run', 'dev'],
    stdout=subprocess.PIPE,
    stderr=subprocess.PIPE,
    env=env
)

print(f'✓ Vite dev server restarted with PID: {process.pid}')

# Store process info for later
with open('/tmp/vite-process.pid', 'w') as f:
    f.write(str(process.pid))

# Wait a bit for Vite to start up
time.sleep(3)

# Touch files to trigger Vite reload
subprocess.run(['touch', '/home/user/app/package.json'])
subprocess.run(['touch', '/home/user/app/vite.config.js'])

print("Vite restarted and should now recognize all packages")
        `);
        
        await sendProgress({ 
          type: 'complete', 
          message: 'Package installation complete and dev server restarted!',
          installedPackages 
        });
        
      } catch (error) {
        const errorMessage = (error as Error).message;
        if (errorMessage && errorMessage !== 'undefined') {
          await sendProgress({ 
            type: 'error', 
            message: errorMessage
          });
        }
      } finally {
        await writer.close();
      }
    })(sandbox);
    
    // Return the stream
    return new Response(stream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
    
  } catch (error) {
    console.error('[install-packages] Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: (error as Error).message 
    }, { status: 500 });
  }
}