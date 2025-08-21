// Cloudflare Pages Function for Advanced Sandbox Management
// Complete implementation with persistent storage, real-time monitoring, and enhanced features

import { Sandbox, ProcessMessage } from 'e2b';

interface Env {
  E2B_API_KEY: string;
  SANDBOX_DB?: any; // Cloudflare D1 database binding
  SANDBOX_KV?: any; // Cloudflare KV binding for session data
}

interface SandboxData {
  id: string;
  url: string;
  status: 'creating' | 'active' | 'idle' | 'error' | 'terminated';
  template: string;
  created: string;
  lastActivity: string;
  projectType?: 'react' | 'vue' | 'angular' | 'vanilla' | 'next';
  packages: string[];
  files: Record<string, string>;
  processes: Array<{ id: string; command: string; status: 'running' | 'stopped'; pid?: number }>;
  resources: {
    cpu: number;
    memory: number;
    disk: number;
  };
  settings: {
    autoSave: boolean;
    hotReload: boolean;
    port: number;
  };
}

interface CreateSandboxOptions {
  template?: 'base' | 'node' | 'python' | 'react' | 'vue' | 'next';
  projectType?: 'react' | 'vue' | 'angular' | 'vanilla' | 'next';
  packages?: string[];
  files?: Record<string, string>;
  settings?: Partial<SandboxData['settings']>;
}

// Enhanced templates for different project types
const SANDBOX_TEMPLATES = {
  react: {
    template: 'base',
    packages: ['react@18.2.0', 'react-dom@18.2.0', 'vite@5.0.0', '@vitejs/plugin-react@4.0.0', 'typescript@5.0.0'],
    files: {
      'package.json': JSON.stringify({
        name: 'open-lovable-react-app',
        version: '1.0.0',
        type: 'module',
        scripts: {
          dev: 'vite --host 0.0.0.0 --port 3000',
          build: 'vite build',
          preview: 'vite preview --host 0.0.0.0 --port 3000'
        },
        dependencies: {
          react: '^18.2.0',
          'react-dom': '^18.2.0'
        },
        devDependencies: {
          '@vitejs/plugin-react': '^4.0.0',
          vite: '^5.0.0',
          typescript: '^5.0.0',
          '@types/react': '^18.2.0',
          '@types/react-dom': '^18.2.0'
        }
      }, null, 2),
      'vite.config.ts': `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    hmr: {
      port: 3001
    }
  },
  preview: {
    host: '0.0.0.0',
    port: 3000
  }
})`,
      'index.html': `<!DOCTYPE html>
<html lang="ar" dir="rtl">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Open Lovable - تطبيق ذكي</title>
    <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700&display=swap" rel="stylesheet">
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`,
      'src/main.tsx': `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)`,
      'src/App.tsx': `import React, { useState } from 'react';
import './App.css';

function App() {
  const [count, setCount] = useState(0);
  const [message, setMessage] = useState('');

  const handleGenerate = () => {
    setMessage('مرحباً! تطبيقك جاهز للتطوير 🚀');
    setCount(prev => prev + 1);
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="hero-section">
          <h1 className="title">
            🚀 Open Lovable
            <span className="subtitle">منصة التطوير الذكية</span>
          </h1>
          
          <div className="stats">
            <div className="stat-card">
              <span className="stat-number">{count}</span>
              <span className="stat-label">مرات التفاعل</span>
            </div>
            <div className="stat-card active">
              <span className="stat-number">✅</span>
              <span className="stat-label">Sandbox نشط</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">🤖</span>
              <span className="stat-label">AI جاهز</span>
            </div>
          </div>
        </div>

        <div className="interaction-section">
          <button className="cta-button" onClick={handleGenerate}>
            ابدأ التطوير الآن
            <span className="button-icon">→</span>
          </button>
          
          {message && (
            <div className="success-message">
              <span className="message-icon">✨</span>
              {message}
            </div>
          )}
        </div>

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">⚡</div>
            <h3>تطوير سريع</h3>
            <p>بيئة تطوير فورية مع Hot Reload</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🎨</div>
            <h3>واجهات جميلة</h3>
            <p>تصاميم عصرية ومتجاوبة</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🔧</div>
            <h3>أدوات متقدمة</h3>
            <p>كل ما تحتاجه في مكان واحد</p>
          </div>
        </div>
      </header>
    </div>
  );
}

export default App;`,
      'src/App.css': `.app {
  font-family: 'Cairo', -apple-system, BlinkMacSystemFont, sans-serif;
  text-align: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  padding: 2rem;
}

.app-header {
  max-width: 1000px;
  width: 100%;
}

.hero-section {
  margin-bottom: 3rem;
}

.title {
  font-size: clamp(2rem, 5vw, 4rem);
  font-weight: 700;
  margin-bottom: 1rem;
  line-height: 1.2;
}

.subtitle {
  display: block;
  font-size: clamp(1rem, 3vw, 1.5rem);
  font-weight: 400;
  opacity: 0.9;
  margin-top: 0.5rem;
}

.stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
  margin: 2rem 0;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

.stat-card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  padding: 1.5rem;
  border-radius: 15px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
}

.stat-card:hover,
.stat-card.active {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-5px);
}

.stat-number {
  display: block;
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.stat-label {
  font-size: 0.9rem;
  opacity: 0.8;
}

.interaction-section {
  margin-bottom: 3rem;
}

.cta-button {
  background: linear-gradient(45deg, #4CAF50, #45a049);
  color: white;
  border: none;
  padding: 1rem 2rem;
  font-size: 1.2rem;
  border-radius: 50px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-family: 'Cairo', sans-serif;
  font-weight: 600;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}

.cta-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 25px rgba(0, 0, 0, 0.3);
}

.button-icon {
  font-size: 1.5rem;
  transition: transform 0.3s ease;
}

.cta-button:hover .button-icon {
  transform: translateX(5px);
}

.success-message {
  margin-top: 1rem;
  padding: 1rem;
  background: rgba(76, 175, 80, 0.2);
  border-radius: 10px;
  border: 1px solid rgba(76, 175, 80, 0.3);
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
}

.message-icon {
  font-size: 1.2rem;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
  margin-top: 3rem;
}

.feature-card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  padding: 2rem;
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
}

.feature-card:hover {
  background: rgba(255, 255, 255, 0.15);
  transform: translateY(-5px);
}

.feature-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.feature-card h3 {
  font-size: 1.3rem;
  font-weight: 600;
  margin-bottom: 1rem;
}

.feature-card p {
  opacity: 0.8;
  line-height: 1.5;
}

@media (max-width: 768px) {
  .app {
    padding: 1rem;
  }
  
  .stats {
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }
  
  .features-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
}`,
      'src/index.css': `* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html {
  direction: rtl;
}

body {
  font-family: 'Cairo', -apple-system, BlinkMacSystemFont, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

#root {
  width: 100%;
  min-height: 100vh;
}`
    }
  },
  next: {
    template: 'base',
    packages: ['next@14', 'react@18', 'react-dom@18', 'typescript@5', '@types/react@18', '@types/node@20'],
    files: {
      'package.json': JSON.stringify({
        name: 'open-lovable-nextjs-app',
        version: '0.1.0',
        private: true,
        scripts: {
          dev: 'next dev --hostname 0.0.0.0 --port 3000',
          build: 'next build',
          start: 'next start --hostname 0.0.0.0 --port 3000',
          lint: 'next lint'
        },
        dependencies: {
          next: '14.0.0',
          react: '18.2.0',
          'react-dom': '18.2.0'
        },
        devDependencies: {
          typescript: '^5.0.0',
          '@types/node': '^20.0.0',
          '@types/react': '^18.2.0',
          '@types/react-dom': '^18.2.0'
        }
      }, null, 2)
    }
  }
};

export async function onRequestPost(context: { request: Request; env: Env }) {
  const { request, env } = context;

  try {
    const requestData = await request.json();
    const { action, sandboxId, ...params } = requestData;

    switch (action) {
      case 'create':
        return await createSandbox(env, params as CreateSandboxOptions);
      case 'status':
        return await getSandboxStatus(sandboxId, env);
      case 'list':
        return await listSandboxes(env);
      case 'update':
        return await updateSandbox(sandboxId, params, env);
      case 'execute':
        return await executeSandboxCommand(sandboxId, params.command, env);
      case 'upload':
        return await uploadFiles(sandboxId, params.files, env);
      case 'download':
        return await downloadFiles(sandboxId, params.paths, env);
      case 'monitor':
        return await getSandboxMetrics(sandboxId, env);
      case 'kill':
        return await killSandbox(sandboxId, env);
      case 'restart':
        return await restartSandbox(sandboxId, env);
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action', availableActions: [
            'create', 'status', 'list', 'update', 'execute', 'upload', 'download', 'monitor', 'kill', 'restart'
          ] }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('Sandbox API error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Sandbox operation failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

async function createSandbox(env: Env, options: CreateSandboxOptions = {}) {
  try {
    const template = SANDBOX_TEMPLATES[options.projectType || 'react'];
    
    const sandbox = await Sandbox.create({
      apiKey: env.E2B_API_KEY,
      template: template.template,
    });

    const sandboxData: SandboxData = {
      id: sandbox.id,
      url: `https://${sandbox.id}.e2b.dev:3000`,
      status: 'creating',
      template: template.template,
      created: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      projectType: options.projectType || 'react',
      packages: template.packages,
      files: template.files,
      processes: [],
      resources: { cpu: 0, memory: 0, disk: 0 },
      settings: {
        autoSave: true,
        hotReload: true,
        port: 3000,
        ...options.settings
      }
    };

    // Store sandbox data in KV or D1
    await storeSandboxData(sandbox.id, sandboxData, env);

    // Initialize the sandbox with project files
    await sandbox.filesystem.write('/package.json', JSON.stringify({
      name: 'open-lovable-sandbox',
      version: '1.0.0',
      type: 'module',
      scripts: {
        dev: 'vite',
        build: 'vite build',
        start: 'vite preview'
      },
      dependencies: {
        react: '^18.2.0',
        'react-dom': '^18.2.0',
        vite: '^5.0.0',
        '@vitejs/plugin-react': '^4.0.0'
      }
    }, null, 2));

    await sandbox.filesystem.write('/index.html', `<!DOCTYPE html>
<html lang="ar" dir="rtl">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Open Lovable App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>`);

    await sandbox.filesystem.write('/vite.config.js', `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 3000
  }
})`);

    await sandbox.filesystem.write('/src/main.jsx', `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)`);

    await sandbox.filesystem.write('/src/App.jsx', `import React from 'react'

function App() {
  return (
    <div style={{ 
      padding: '2rem', 
      fontFamily: 'Arial, sans-serif',
      textAlign: 'center',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>🚀 Open Lovable</h1>
      <p style={{ fontSize: '1.2rem', marginBottom: '2rem' }}>
        مرحباً بك في بيئة التطوير الذكية
      </p>
      <div style={{ 
        background: 'rgba(255,255,255,0.1)', 
        padding: '2rem', 
        borderRadius: '1rem',
        backdropFilter: 'blur(10px)'
      }}>
        <p>✅ Sandbox جاهز للاستخدام</p>
        <p>✅ React & Vite مثبتان</p>
        <p>✅ يمكن البدء في التطوير الآن</p>
      </div>
    </div>
  )
}

export default App`);

    // Install packages
    await sandbox.process.start({
      cmd: 'npm install',
      onStdout: (data) => console.log('npm install:', data),
      onStderr: (data) => console.error('npm install error:', data),
    });

    // Start dev server
    const devServer = await sandbox.process.start({
      cmd: 'npm run dev',
      onStdout: (data) => console.log('dev server:', data),
      onStderr: (data) => console.error('dev server error:', data),
    });

    return new Response(
      JSON.stringify({
        success: true,
        sandboxId: sandbox.id,
        url: `https://${sandbox.id}.e2b.dev`,
        message: 'Sandbox created successfully',
        structure: 'React + Vite project initialized'
      }),
      {
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );

  } catch (error) {
    console.error('Create sandbox error:', error);
    throw error;
  }
}

async function getSandboxStatus(sandboxId: string, env: Env) {
  const sandboxData = await getSandboxData(sandboxId, env);
  
  if (!sandboxData) {
    return new Response(
      JSON.stringify({ active: false, healthy: false, error: 'Sandbox not found' }),
      { status: 404, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Check if sandbox is actually responsive
  let isHealthy = true;
  try {
    const healthCheck = await fetch(`${sandboxData.url}/health`, { 
      method: 'GET',
      signal: AbortSignal.timeout(5000)
    });
    isHealthy = healthCheck.ok;
  } catch {
    isHealthy = false;
  }

  // Update last activity
  sandboxData.lastActivity = new Date().toISOString();
  sandboxData.status = isHealthy ? 'active' : 'error';
  await storeSandboxData(sandboxId, sandboxData, env);

  return new Response(
    JSON.stringify({
      active: true,
      healthy: isHealthy,
      sandboxData,
      uptime: Date.now() - new Date(sandboxData.created).getTime()
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
}

async function killSandbox(sandboxId: string, env: Env) {
  try {
    const sandboxData = await getSandboxData(sandboxId, env);
    if (!sandboxData) {
      return new Response(
        JSON.stringify({ success: false, error: 'Sandbox not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Actually terminate the E2B sandbox
    try {
      const sandbox = await Sandbox.connect(sandboxId, { apiKey: env.E2B_API_KEY });
      await sandbox.close();
    } catch (error) {
      console.log('Sandbox already terminated or not accessible:', error);
    }

    // Update status and remove from storage
    sandboxData.status = 'terminated';
    await storeSandboxData(sandboxId, sandboxData, env);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Sandbox terminated successfully',
        terminatedAt: new Date().toISOString()
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Kill sandbox error:', error);
    throw error;
  }
}

// Storage helper functions
async function storeSandboxData(sandboxId: string, data: SandboxData, env: Env): Promise<void> {
  if (env.SANDBOX_KV) {
    await env.SANDBOX_KV.put(`sandbox:${sandboxId}`, JSON.stringify(data), {
      expirationTtl: 86400 * 7 // 7 days
    });
  } else if (env.SANDBOX_DB) {
    await env.SANDBOX_DB.prepare(`
      INSERT OR REPLACE INTO sandboxes (id, data, created_at, updated_at)
      VALUES (?, ?, ?, ?)
    `).bind(
      sandboxId,
      JSON.stringify(data),
      data.created,
      new Date().toISOString()
    ).run();
  }
}

async function getSandboxData(sandboxId: string, env: Env): Promise<SandboxData | null> {
  if (env.SANDBOX_KV) {
    const data = await env.SANDBOX_KV.get(`sandbox:${sandboxId}`);
    return data ? JSON.parse(data) : null;
  } else if (env.SANDBOX_DB) {
    const result = await env.SANDBOX_DB.prepare(
      'SELECT data FROM sandboxes WHERE id = ?'
    ).bind(sandboxId).first();
    return result ? JSON.parse(result.data) : null;
  }
  return null;
}

// Complete implementation of all sandbox management functions
async function listSandboxes(env: Env) {
  try {
    const sandboxes: Array<{ id: string; data: SandboxData; lastAccess: string }> = [];
    
    if (env.SANDBOX_KV) {
      // Get all sandbox keys from KV
      const { keys } = await env.SANDBOX_KV.list({ prefix: 'sandbox:' });
      
      for (const key of keys) {
        const data = await env.SANDBOX_KV.get(key.name);
        if (data) {
          const sandboxData = JSON.parse(data);
          sandboxes.push({
            id: key.name.replace('sandbox:', ''),
            data: sandboxData,
            lastAccess: key.metadata?.lastAccess || sandboxData.lastActivity
          });
        }
      }
    } else if (env.SANDBOX_DB) {
      // Get all sandboxes from D1
      const result = await env.SANDBOX_DB.prepare(
        'SELECT id, data, updated_at FROM sandboxes ORDER BY updated_at DESC LIMIT 50'
      ).all();
      
      for (const row of result.results) {
        sandboxes.push({
          id: row.id,
          data: JSON.parse(row.data),
          lastAccess: row.updated_at
        });
      }
    }
    
    // Filter out terminated sandboxes older than 1 hour
    const activeWindow = Date.now() - (60 * 60 * 1000); // 1 hour
    const activeSandboxes = sandboxes.filter(s => {
      if (s.data.status === 'terminated') {
        return new Date(s.lastAccess).getTime() > activeWindow;
      }
      return true;
    });
    
    return new Response(JSON.stringify({
      success: true,
      count: activeSandboxes.length,
      sandboxes: activeSandboxes.map(s => ({
        id: s.id,
        status: s.data.status,
        template: s.data.template,
        created: s.data.created,
        lastActivity: s.data.lastActivity,
        url: s.data.url,
        projectType: s.data.projectType
      })),
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    console.error('List sandboxes error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to list sandboxes',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function updateSandbox(sandboxId: string, params: any, env: Env) {
  try {
    const sandboxData = await getSandboxData(sandboxId, env);
    
    if (!sandboxData) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Sandbox not found'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Update sandbox settings
    const updatedData = { ...sandboxData };
    
    if (params.settings) {
      updatedData.settings = { ...updatedData.settings, ...params.settings };
    }
    
    if (params.packages && Array.isArray(params.packages)) {
      updatedData.packages = [...new Set([...updatedData.packages, ...params.packages])];
    }
    
    if (params.status && ['creating', 'active', 'idle', 'error', 'terminated'].includes(params.status)) {
      updatedData.status = params.status;
    }
    
    updatedData.lastActivity = new Date().toISOString();
    
    // Store updated data
    await storeSandboxData(sandboxId, updatedData, env);
    
    return new Response(JSON.stringify({
      success: true,
      sandboxData: updatedData,
      message: 'Sandbox updated successfully'
    }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    console.error('Update sandbox error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to update sandbox',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function executeSandboxCommand(sandboxId: string, command: string, env: Env) {
  try {
    const sandboxData = await getSandboxData(sandboxId, env);
    
    if (!sandboxData) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Sandbox not found'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Connect to the E2B sandbox
    const sandbox = await Sandbox.connect(sandboxId, {
      apiKey: env.E2B_API_KEY,
      timeout: 30000
    });
    
    // Execute the command
    const result = await sandbox.commands.run(command, {
      cwd: '/home/user/app',
      timeout: 60
    });
    
    // Record the command execution
    const processInfo = {
      id: `proc_${Date.now()}`,
      command: command,
      status: result.exitCode === 0 ? 'completed' : 'failed',
      exitCode: result.exitCode,
      stdout: result.stdout,
      stderr: result.stderr,
      timestamp: new Date().toISOString()
    };
    
    // Update sandbox data with command history
    sandboxData.processes = sandboxData.processes || [];
    sandboxData.processes.push({
      id: processInfo.id,
      command: command,
      status: result.exitCode === 0 ? 'running' : 'stopped',
      pid: undefined // E2B doesn't provide PID in this context
    });
    
    // Keep only last 10 processes
    if (sandboxData.processes.length > 10) {
      sandboxData.processes = sandboxData.processes.slice(-10);
    }
    
    sandboxData.lastActivity = new Date().toISOString();
    await storeSandboxData(sandboxId, sandboxData, env);
    
    return new Response(JSON.stringify({
      success: true,
      execution: processInfo,
      sandbox: {
        id: sandboxId,
        status: sandboxData.status,
        lastActivity: sandboxData.lastActivity
      }
    }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    console.error('Execute sandbox command error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to execute command',
      details: error instanceof Error ? error.message : 'Unknown error',
      command: command
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function uploadFiles(sandboxId: string, files: Record<string, string>, env: Env) {
  try {
    const sandboxData = await getSandboxData(sandboxId, env);
    
    if (!sandboxData) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Sandbox not found'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Connect to the E2B sandbox
    const sandbox = await Sandbox.connect(sandboxId, {
      apiKey: env.E2B_API_KEY,
      timeout: 30000
    });
    
    const uploadResults = [];
    
    for (const [filePath, content] of Object.entries(files)) {
      try {
        // Normalize file path
        let normalizedPath = filePath.startsWith('/') ? filePath : `/home/user/app/${filePath}`;
        
        // Create directory if needed
        const dir = normalizedPath.substring(0, normalizedPath.lastIndexOf('/'));
        await sandbox.runCode(`import os; os.makedirs('${dir}', exist_ok=True)`);
        
        // Write file content
        const escapedContent = content.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
        await sandbox.runCode(`
with open('${normalizedPath}', 'w', encoding='utf-8') as f:
    f.write("""${escapedContent}""")
`);
        
        uploadResults.push({
          path: filePath,
          status: 'success',
          size: content.length
        });
        
        // Update sandbox data
        sandboxData.files[filePath] = content;
      } catch (fileError) {
        console.error(`Failed to upload ${filePath}:`, fileError);
        uploadResults.push({
          path: filePath,
          status: 'error',
          error: (fileError as Error).message
        });
      }
    }
    
    sandboxData.lastActivity = new Date().toISOString();
    await storeSandboxData(sandboxId, sandboxData, env);
    
    const successCount = uploadResults.filter(r => r.status === 'success').length;
    
    return new Response(JSON.stringify({
      success: successCount > 0,
      uploadResults,
      summary: {
        total: uploadResults.length,
        successful: successCount,
        failed: uploadResults.length - successCount
      },
      sandbox: {
        id: sandboxId,
        fileCount: Object.keys(sandboxData.files).length
      }
    }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    console.error('Upload files error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to upload files',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function downloadFiles(sandboxId: string, paths: string[], env: Env) {
  try {
    const sandboxData = await getSandboxData(sandboxId, env);
    
    if (!sandboxData) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Sandbox not found'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Connect to the E2B sandbox
    const sandbox = await Sandbox.connect(sandboxId, {
      apiKey: env.E2B_API_KEY,
      timeout: 30000
    });
    
    const downloadResults = [];
    
    for (const filePath of paths) {
      try {
        // Normalize file path
        let normalizedPath = filePath.startsWith('/') ? filePath : `/home/user/app/${filePath}`;
        
        // Check if file exists and read it
        const result = await sandbox.runCode(`
import os
if os.path.exists('${normalizedPath}'):
    with open('${normalizedPath}', 'r', encoding='utf-8') as f:
        print('FILE_CONTENT_START')
        print(f.read())
        print('FILE_CONTENT_END')
else:
    print('FILE_NOT_FOUND')
`);
        
        if (result.stdout.includes('FILE_NOT_FOUND')) {
          downloadResults.push({
            path: filePath,
            status: 'not_found',
            error: 'File does not exist'
          });
        } else {
          // Extract file content between markers
          const startMarker = 'FILE_CONTENT_START\n';
          const endMarker = '\nFILE_CONTENT_END';
          const startIndex = result.stdout.indexOf(startMarker);
          const endIndex = result.stdout.lastIndexOf(endMarker);
          
          if (startIndex !== -1 && endIndex !== -1) {
            const content = result.stdout.substring(
              startIndex + startMarker.length,
              endIndex
            );
            
            downloadResults.push({
              path: filePath,
              status: 'success',
              content: content,
              size: content.length,
              lastModified: new Date().toISOString()
            });
          } else {
            downloadResults.push({
              path: filePath,
              status: 'error',
              error: 'Failed to extract file content'
            });
          }
        }
      } catch (fileError) {
        console.error(`Failed to download ${filePath}:`, fileError);
        downloadResults.push({
          path: filePath,
          status: 'error',
          error: (fileError as Error).message
        });
      }
    }
    
    const successCount = downloadResults.filter(r => r.status === 'success').length;
    
    return new Response(JSON.stringify({
      success: successCount > 0,
      files: downloadResults,
      summary: {
        total: downloadResults.length,
        successful: successCount,
        failed: downloadResults.length - successCount,
        notFound: downloadResults.filter(r => r.status === 'not_found').length
      },
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    console.error('Download files error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to download files',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function getSandboxMetrics(sandboxId: string, env: Env) {
  try {
    const sandboxData = await getSandboxData(sandboxId, env);
    
    if (!sandboxData) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Sandbox not found'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Connect to the E2B sandbox
    const sandbox = await Sandbox.connect(sandboxId, {
      apiKey: env.E2B_API_KEY,
      timeout: 15000
    });
    
    // Get system metrics
    const metricsResult = await sandbox.runCode(`
import os
import psutil
import json

try:
    # CPU usage
    cpu_percent = psutil.cpu_percent(interval=1)
    
    # Memory usage
    memory = psutil.virtual_memory()
    
    # Disk usage
    disk = psutil.disk_usage('/home/user/app')
    
    # Process count
    process_count = len(psutil.pids())
    
    # Network stats (if available)
    try:
        net_io = psutil.net_io_counters()
        network = {
            'bytes_sent': net_io.bytes_sent,
            'bytes_recv': net_io.bytes_recv,
            'packets_sent': net_io.packets_sent,
            'packets_recv': net_io.packets_recv
        }
    except:
        network = {'error': 'Network stats not available'}
    
    # System uptime
    uptime_seconds = psutil.boot_time()
    
    metrics = {
        'cpu': {
            'usage_percent': cpu_percent,
            'count': psutil.cpu_count()
        },
        'memory': {
            'total': memory.total,
            'available': memory.available,
            'used': memory.used,
            'usage_percent': memory.percent
        },
        'disk': {
            'total': disk.total,
            'used': disk.used,
            'free': disk.free,
            'usage_percent': (disk.used / disk.total) * 100
        },
        'system': {
            'process_count': process_count,
            'uptime_seconds': uptime_seconds
        },
        'network': network
    }
    
    print('METRICS_START')
    print(json.dumps(metrics))
    print('METRICS_END')
except Exception as e:
    print(f'METRICS_ERROR: {str(e)}')
`);
    
    let metrics = {};
    
    if (metricsResult.stdout.includes('METRICS_START')) {
      // Extract metrics from output
      const startMarker = 'METRICS_START\n';
      const endMarker = '\nMETRICS_END';
      const startIndex = metricsResult.stdout.indexOf(startMarker);
      const endIndex = metricsResult.stdout.lastIndexOf(endMarker);
      
      if (startIndex !== -1 && endIndex !== -1) {
        const metricsJson = metricsResult.stdout.substring(
          startIndex + startMarker.length,
          endIndex
        );
        
        try {
          metrics = JSON.parse(metricsJson);
        } catch {
          metrics = { error: 'Failed to parse metrics JSON' };
        }
      }
    } else if (metricsResult.stdout.includes('METRICS_ERROR')) {
      metrics = { error: metricsResult.stdout.match(/METRICS_ERROR: (.+)/)?.[1] || 'Unknown error' };
    } else {
      metrics = { error: 'No metrics data returned' };
    }
    
    // Update sandbox data with current metrics
    sandboxData.resources = {
      cpu: (metrics as any).cpu?.usage_percent || 0,
      memory: (metrics as any).memory?.usage_percent || 0,
      disk: (metrics as any).disk?.usage_percent || 0
    };
    
    sandboxData.lastActivity = new Date().toISOString();
    await storeSandboxData(sandboxId, sandboxData, env);
    
    // Calculate uptime from sandbox creation
    const uptimeMs = Date.now() - new Date(sandboxData.created).getTime();
    
    return new Response(JSON.stringify({
      success: true,
      sandboxId,
      metrics,
      sandbox: {
        status: sandboxData.status,
        created: sandboxData.created,
        uptime: {
          milliseconds: uptimeMs,
          seconds: Math.floor(uptimeMs / 1000),
          minutes: Math.floor(uptimeMs / 60000),
          hours: Math.floor(uptimeMs / 3600000)
        },
        processes: sandboxData.processes.length,
        files: Object.keys(sandboxData.files).length
      },
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    console.error('Get sandbox metrics error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to get sandbox metrics',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function restartSandbox(sandboxId: string, env: Env) {
  try {
    const sandboxData = await getSandboxData(sandboxId, env);
    
    if (!sandboxData) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Sandbox not found'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Connect to the E2B sandbox
    const sandbox = await Sandbox.connect(sandboxId, {
      apiKey: env.E2B_API_KEY,
      timeout: 30000
    });
    
    // Stop any running development servers
    try {
      await sandbox.runCode(`
import subprocess
import signal
import os

# Kill any npm/node processes
try:
    subprocess.run(['pkill', '-f', 'npm'], timeout=5)
    subprocess.run(['pkill', '-f', 'node'], timeout=5)
    subprocess.run(['pkill', '-f', 'vite'], timeout=5)
    print('Stopped existing processes')
except Exception as e:
    print(f'Process cleanup: {e}')
`);
    } catch {
      // Ignore errors in cleanup
    }
    
    // Wait a moment for processes to stop
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Restart the development server based on project type
    let startCommand = 'npm run dev';
    if (sandboxData.projectType === 'next') {
      startCommand = 'npm run dev -- --hostname 0.0.0.0 --port 3000';
    } else if (sandboxData.projectType === 'vue') {
      startCommand = 'npm run dev -- --host 0.0.0.0 --port 3000';
    } else {
      startCommand = 'npm run dev';
    }
    
    // Start the development server in background
    const serverProcess = sandbox.process.start({
      cmd: startCommand,
      cwd: '/home/user/app',
      onStdout: (data) => console.log(`[${sandboxId}] Dev server:`, data),
      onStderr: (data) => console.log(`[${sandboxId}] Dev server error:`, data)
    });
    
    // Update sandbox status and processes
    sandboxData.status = 'active';
    sandboxData.processes = [
      {
        id: `restart_${Date.now()}`,
        command: startCommand,
        status: 'running',
        pid: undefined
      }
    ];
    sandboxData.lastActivity = new Date().toISOString();
    
    await storeSandboxData(sandboxId, sandboxData, env);
    
    // Wait a bit to see if the server starts successfully
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Test if the server is responding
    let serverStatus = 'starting';
    try {
      const testResponse = await fetch(sandboxData.url, {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });
      serverStatus = testResponse.ok ? 'running' : 'error';
    } catch {
      serverStatus = 'starting'; // Still starting up
    }
    
    return new Response(JSON.stringify({
      success: true,
      sandboxId,
      status: serverStatus,
      url: sandboxData.url,
      restartedAt: new Date().toISOString(),
      message: serverStatus === 'running' 
        ? 'Sandbox restarted and server is running'
        : 'Sandbox restarted, server is starting up',
      processes: sandboxData.processes
    }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    console.error('Restart sandbox error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to restart sandbox',
      details: error instanceof Error ? error.message : 'Unknown error',
      sandboxId
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Handle GET requests for status checks
export async function onRequestGet(context: { request: Request; env: Env }) {
  const { request, env } = context;
  const url = new URL(request.url);
  const sandboxId = url.searchParams.get('sandboxId');
  
  if (sandboxId) {
    return await getSandboxStatus(sandboxId, env);
  }
  
  return new Response(
    JSON.stringify({ 
      message: 'Advanced Sandbox API is running',
      version: '2.0.0',
      features: ['create', 'status', 'list', 'execute', 'monitor', 'files'],
      timestamp: new Date().toISOString()
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
}

// Handle CORS
export async function onRequestOptions() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}