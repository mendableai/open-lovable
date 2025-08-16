import { NextRequest, NextResponse } from 'next/server';
import { E2B } from 'e2b';

// Initialize E2B client with real API key
const e2b = new E2B(process.env.E2B_API_KEY!);

export async function POST(request: NextRequest) {
  try {
    const { action, sandboxId, files, packages } = await request.json();

    switch (action) {
      case 'create':
        return await createSandbox();
      case 'update':
        return await updateSandbox(sandboxId, files);
      case 'install':
        return await installPackages(sandboxId, packages);
      case 'status':
        return await getSandboxStatus(sandboxId);
      case 'delete':
        return await deleteSandbox(sandboxId);
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Sandbox API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function createSandbox() {
  try {
    // Create real E2B sandbox
    const sandbox = await e2b.sandbox.create({
      template: 'base',
      metadata: {
        name: 'open-lovable-sandbox',
        description: 'AI-powered code generation sandbox'
      }
    });

    // Initialize with basic project structure
    const initialFiles = {
      'package.json': JSON.stringify({
        name: 'open-lovable-project',
        version: '1.0.0',
        type: 'module',
        scripts: {
          dev: 'vite',
          build: 'vite build',
          preview: 'vite preview'
        },
        dependencies: {
          'react': '^18.2.0',
          'react-dom': '^18.2.0'
        },
        devDependencies: {
          '@vitejs/plugin-react': '^4.0.0',
          'vite': '^4.4.0'
        }
      }, null, 2),
      'vite.config.js': `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true
  }
})`,
      'index.html': `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Open-Lovable Project</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>`,
      'src/main.jsx': `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)`,
      'src/App.jsx': `import { useState } from 'react'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="App">
      <h1>Open-Lovable Project</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.jsx</code> and save to test HMR
        </p>
      </div>
    </div>
  )
}

export default App`,
      'src/App.css': `#root {
  max-width: 1280px;
  margin: 0 auto;
  padding: 2rem;
  text-align: center;
}

.card {
  padding: 2em;
}

button {
  border-radius: 8px;
  border: 1px solid transparent;
  padding: 0.6em 1.2em;
  font-size: 1em;
  font-weight: 500;
  font-family: inherit;
  background-color: #1a1a1a;
  color: white;
  cursor: pointer;
  transition: border-color 0.25s;
}

button:hover {
  border-color: #646cff;
}

button:focus,
button:focus-visible {
  outline: 4px auto -webkit-focus-ring-color;
}`,
      'src/index.css': `:root {
  font-family: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif;
  line-height: 1.5;
  font-weight: 400;

  color-scheme: light dark;
  color: rgba(255, 255, 255, 0.87);
  background-color: #242424;

  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  -webkit-text-size-adjust: 100%;
}

body {
  margin: 0;
  display: flex;
  place-items: center;
  min-width: 320px;
  min-height: 100vh;
}

h1 {
  font-size: 3.2em;
  line-height: 1.1;
}`
    };

    // Write initial files to sandbox
    for (const [path, content] of Object.entries(initialFiles)) {
      await sandbox.filesystem.write(path, content);
    }

    // Start the sandbox
    await sandbox.start();

    return NextResponse.json({
      success: true,
      sandboxId: sandbox.sandboxId,
      url: `https://${sandbox.sandboxId}-3000.e2b.dev`,
      status: 'running'
    });
  } catch (error) {
    console.error('Failed to create sandbox:', error);
    throw error;
  }
}

async function updateSandbox(sandboxId: string, files: Record<string, string>) {
  try {
    const sandbox = await e2b.sandbox.connect(sandboxId);
    
    // Write files to sandbox
    for (const [path, content] of Object.entries(files)) {
      await sandbox.filesystem.write(path, content);
    }

    return NextResponse.json({
      success: true,
      message: 'Files updated successfully'
    });
  } catch (error) {
    console.error('Failed to update sandbox:', error);
    throw error;
  }
}

async function installPackages(sandboxId: string, packages: string[]) {
  try {
    const sandbox = await e2b.sandbox.connect(sandboxId);
    
    // Install packages using npm
    const installCommand = `npm install ${packages.join(' ')}`;
    const result = await sandbox.process.start({
      cmd: installCommand,
      cwd: '/home/user'
    });

    return NextResponse.json({
      success: true,
      message: 'Packages installed successfully',
      output: result.output
    });
  } catch (error) {
    console.error('Failed to install packages:', error);
    throw error;
  }
}

async function getSandboxStatus(sandboxId: string) {
  try {
    const sandbox = await e2b.sandbox.connect(sandboxId);
    const status = await sandbox.status();
    
    return NextResponse.json({
      success: true,
      status: status,
      url: `https://${sandboxId}-3000.e2b.dev`
    });
  } catch (error) {
    console.error('Failed to get sandbox status:', error);
    throw error;
  }
}

async function deleteSandbox(sandboxId: string) {
  try {
    const sandbox = await e2b.sandbox.connect(sandboxId);
    await sandbox.close();
    
    return NextResponse.json({
      success: true,
      message: 'Sandbox deleted successfully'
    });
  } catch (error) {
    console.error('Failed to delete sandbox:', error);
    throw error;
  }
}