import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

declare global {
  var activeSandbox: any;
}

export async function POST(_: NextRequest) {
  try {
    if (!globalThis.activeSandbox) {
      return NextResponse.json({ 
        success: false, 
        error: 'No active sandbox' 
      }, { status: 400 });
    }
    
    console.log('[create-zip] Creating project zip...');
    
    // Create zip file in sandbox
    await globalThis.activeSandbox.runCode(`
import zipfile
import os
import json

os.chdir('/home/user/app')

# Create zip file
with zipfile.ZipFile('/tmp/project.zip', 'w', zipfile.ZIP_DEFLATED) as zipf:
    for root, dirs, files in os.walk('.'):
        # Skip node_modules and .git
        dirs[:] = [d for d in dirs if d not in ['node_modules', '.git', '.next', 'dist']]
        
        for file in files:
            file_path = os.path.join(root, file)
            arcname = os.path.relpath(file_path, '.')
            zipf.write(file_path, arcname)

# Get file size
file_size = os.path.getsize('/tmp/project.zip')
print(f" Created project.zip ({file_size} bytes)")
    `);
    
    // Read the zip file and convert to base64
    const readResult = await globalThis.activeSandbox.runCode(`
import base64

with open('/tmp/project.zip', 'rb') as f:
    content = f.read()
    encoded = base64.b64encode(content).decode('utf-8')
    print(encoded)
    `);
    
    const base64Content = readResult.logs.stdout.join('').trim();
    
    // Create a data URL for download
    const dataUrl = `data:application/zip;base64,${base64Content}`;
    
    return NextResponse.json({
      success: true,
      dataUrl,
      fileName: 'e2b-project.zip',
      message: 'Zip file created successfully'
    });
    
  } catch (error) {
    console.error('[create-zip] Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: (error as Error).message 
    }, { status: 500 });
  }
}