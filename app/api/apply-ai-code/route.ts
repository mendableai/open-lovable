import { NextRequest, NextResponse } from 'next/server';
import type { SandboxState } from '@/types/sandbox';
import type { ConversationState } from '@/types/conversation';
import { log } from '@/lib/logger';

declare global {
  var conversationState: ConversationState | null;
}

interface ParsedResponse {
  explanation: string;
  template: string;
  files: Array<{ path: string; content: string }>;
  packages: string[];
  commands: string[];
  structure: string | null;
}

function parseAIResponse(response: string): ParsedResponse {
  const sections = {
    files: [] as Array<{ path: string; content: string }>,
    commands: [] as string[],
    packages: [] as string[],
    structure: null as string | null,
    explanation: '',
    template: ''
  };

  // Parse file sections - handle duplicates and prefer complete versions
  const fileMap = new Map<string, { content: string; isComplete: boolean }>();
  
  const fileRegex = /<file path="([^"]+)">([\s\S]*?)(?:<\/file>|$)/g;
  let match;
  while ((match = fileRegex.exec(response)) !== null) {
    const filePath = match[1];
    const content = match[2].trim();
    const hasClosingTag = response.substring(match.index, match.index + match[0].length).includes('</file>');
    
    // Check if this file already exists in our map
    const existing = fileMap.get(filePath);
    
    // Decide whether to keep this version
    let shouldReplace = false;
    if (!existing) {
      shouldReplace = true; // First occurrence
    } else if (!existing.isComplete && hasClosingTag) {
      shouldReplace = true; // Replace incomplete with complete
      log.file('Replacing incomplete with complete version', filePath);
    } else if (existing.isComplete && hasClosingTag && content.length > existing.content.length) {
      shouldReplace = true; // Replace with longer complete version
      log.file('Replacing with longer complete version', filePath, { length: content.length });
    } else if (!existing.isComplete && !hasClosingTag && content.length > existing.content.length) {
      shouldReplace = true; // Both incomplete, keep longer one
    }
    
    if (shouldReplace) {
      // Additional validation: reject obviously broken content
      if (content.includes('...') && !content.includes('...props') && !content.includes('...rest')) {
        log.warn('File contains ellipsis, may be truncated', 'parseAIResponse', { filePath });
        // Still use it if it's the only version we have
        if (!existing) {
          fileMap.set(filePath, { content, isComplete: hasClosingTag });
        }
      } else {
        fileMap.set(filePath, { content, isComplete: hasClosingTag });
      }
    }
  }
  
  // Convert map to array for sections.files
  for (const [path, { content, isComplete }] of fileMap.entries()) {
    if (!isComplete) {
      log.warn('File appears to be truncated (no closing tag)', 'parseAIResponse', { path });
    }
    
    sections.files.push({
      path,
      content
    });
  }

  // Parse commands
  const cmdRegex = /<command>(.*?)<\/command>/g;
  while ((match = cmdRegex.exec(response)) !== null) {
    sections.commands.push(match[1].trim());
  }

  // Parse packages - support both <package> and <packages> tags
  const pkgRegex = /<package>(.*?)<\/package>/g;
  while ((match = pkgRegex.exec(response)) !== null) {
    sections.packages.push(match[1].trim());
  }
  
  // Also parse <packages> tag with multiple packages
  const packagesRegex = /<packages>([\s\S]*?)<\/packages>/;
  const packagesMatch = response.match(packagesRegex);
  if (packagesMatch) {
    const packagesContent = packagesMatch[1].trim();
    // Split by newlines or commas
    const packagesList = packagesContent.split(/[\n,]+/)
      .map(pkg => pkg.trim())
      .filter(pkg => pkg.length > 0);
    sections.packages.push(...packagesList);
  }

  // Parse structure
  const structureMatch = /<structure>([\s\S]*?)<\/structure>/;
  const structResult = response.match(structureMatch);
  if (structResult) {
    sections.structure = structResult[1].trim();
  }

  // Parse explanation
  const explanationMatch = /<explanation>([\s\S]*?)<\/explanation>/;
  const explResult = response.match(explanationMatch);
  if (explResult) {
    sections.explanation = explResult[1].trim();
  }

  // Parse template
  const templateMatch = /<template>(.*?)<\/template>/;
  const templResult = response.match(templateMatch);
  if (templResult) {
    sections.template = templResult[1].trim();
  }

  return sections;
}

declare global {
  var activeSandbox: any;
  var existingFiles: Set<string>;
  var sandboxState: SandboxState;
}

export async function POST(request: NextRequest) {
  try {
    const { response, isEdit = false, packages = [] } = await request.json();
    
    if (!response) {
      return NextResponse.json({
        error: 'response is required'
      }, { status: 400 });
    }
    
    // Parse the AI response
    const parsed = parseAIResponse(response);
    
    // Initialize existingFiles if not already
    if (!global.existingFiles) {
      global.existingFiles = new Set<string>();
    }
    
    // If no active sandbox, just return parsed results
    if (!global.activeSandbox) {
      return NextResponse.json({
        success: true,
        results: {
          filesCreated: parsed.files.map(f => f.path),
          packagesInstalled: parsed.packages,
          commandsExecuted: parsed.commands,
          errors: []
        },
        explanation: parsed.explanation,
        structure: parsed.structure,
        parsedFiles: parsed.files,
        message: `Parsed ${parsed.files.length} files successfully. Create a sandbox to apply them.`
      });
    }
    
    // Apply to active sandbox
    log.debug('Applying code to sandbox', 'apply-ai-code', {
      isEdit,
      filesToWrite: parsed.files.map(f => f.path),
      existingFiles: Array.from(global.existingFiles)
    });
    
    const results = {
      filesCreated: [] as string[],
      filesUpdated: [] as string[],
      packagesInstalled: [] as string[],
      packagesAlreadyInstalled: [] as string[],
      packagesFailed: [] as string[],
      commandsExecuted: [] as string[],
      errors: [] as string[]
    };
    
    // Combine packages from tool calls and parsed XML tags
    const allPackages = [...packages.filter((pkg: any) => pkg && typeof pkg === 'string'), ...parsed.packages];
    const uniquePackages = [...new Set(allPackages)]; // Remove duplicates
    
    if (uniquePackages.length > 0) {
      log.debug('Installing packages from XML tags and tool calls', 'apply-ai-code', { packages: uniquePackages });
      
      try {
        const installResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/install-packages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ packages: uniquePackages })
        });
        
        if (installResponse.ok) {
          const installResult = await installResponse.json();
          log.debug('Package installation result', 'apply-ai-code', installResult);
          
          if (installResult.installed && installResult.installed.length > 0) {
            results.packagesInstalled = installResult.installed;
          }
          if (installResult.failed && installResult.failed.length > 0) {
            results.packagesFailed = installResult.failed;
          }
        }
      } catch (error) {
        log.error('Error installing packages', 'apply-ai-code', { error });
      }
    } else {
      // Fallback to detecting packages from code
      log.debug('No packages provided, detecting from generated code', 'apply-ai-code', { 
        filesToScan: parsed.files.length 
      });
      
      // Filter out config files first
      const configFiles = ['tailwind.config.js', 'vite.config.js', 'package.json', 'package-lock.json', 'tsconfig.json', 'postcss.config.js'];
      const filteredFilesForDetection = parsed.files.filter(file => {
        const fileName = file.path.split('/').pop() || '';
        return !configFiles.includes(fileName);
      });
      
      // Build files object for package detection
      const filesForPackageDetection: Record<string, string> = {};
      for (const file of filteredFilesForDetection) {
        filesForPackageDetection[file.path] = file.content;
        // Log if heroicons is found
        if (file.content.includes('heroicons')) {
          log.debug('Found heroicons import', 'apply-ai-code', { filePath: file.path });
        }
      }
      
      try {
        log.debug('Calling detect-and-install-packages', 'apply-ai-code');
        const packageResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/detect-and-install-packages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ files: filesForPackageDetection })
        });
        
        log.debug('Package detection response', 'apply-ai-code', { status: packageResponse.status });
        
        if (packageResponse.ok) {
          const packageResult = await packageResponse.json();
          log.debug('Package installation result', 'apply-ai-code', packageResult);
        
        if (packageResult.packagesInstalled && packageResult.packagesInstalled.length > 0) {
          results.packagesInstalled = packageResult.packagesInstalled;
          log.package('Installed packages', packageResult.packagesInstalled.join(', '));
        }
        
        if (packageResult.packagesAlreadyInstalled && packageResult.packagesAlreadyInstalled.length > 0) {
          results.packagesAlreadyInstalled = packageResult.packagesAlreadyInstalled;
          log.debug('Already installed packages', 'apply-ai-code', { packages: packageResult.packagesAlreadyInstalled });
        }
        
        if (packageResult.packagesFailed && packageResult.packagesFailed.length > 0) {
          results.packagesFailed = packageResult.packagesFailed;
          log.error('Failed to install packages', 'apply-ai-code', { packages: packageResult.packagesFailed });
          results.errors.push(`Failed to install packages: ${packageResult.packagesFailed.join(', ')}`);
        }
        
        // Force Vite restart after package installation
        if (results.packagesInstalled.length > 0) {
          log.debug('Packages were installed, forcing Vite restart', 'apply-ai-code');
          
          try {
            // Call the restart-vite endpoint
            const restartResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/restart-vite`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' }
            });
            
            if (restartResponse.ok) {
              const restartResult = await restartResponse.json();
              log.debug('Vite restart result', 'apply-ai-code', { message: restartResult.message });
            } else {
              log.error('Failed to restart Vite', 'apply-ai-code', { error: await restartResponse.text() });
            }
          } catch (e) {
            log.error('Error calling restart-vite', 'apply-ai-code', { error: e });
          }
          
          // Additional delay to ensure files can be written after restart
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        } else {
          log.error('Package detection/installation failed', 'apply-ai-code', { error: await packageResponse.text() });
        }
      } catch (error) {
        log.error('Error detecting/installing packages', 'apply-ai-code', { error });
        // Continue with file writing even if package installation fails
      }
    }
    
    // Filter out config files that shouldn't be created
    const configFiles = ['tailwind.config.js', 'vite.config.js', 'package.json', 'package-lock.json', 'tsconfig.json', 'postcss.config.js'];
    const filteredFiles = parsed.files.filter(file => {
      const fileName = file.path.split('/').pop() || '';
      if (configFiles.includes(fileName)) {
        log.warn('Skipping config file - already exists in template', 'apply-ai-code', { filePath: file.path });
        return false;
      }
      return true;
    });
    
    // Create or update files AFTER package installation
    for (const file of filteredFiles) {
      try {
        // Normalize the file path
        let normalizedPath = file.path;
        // Remove leading slash if present
        if (normalizedPath.startsWith('/')) {
          normalizedPath = normalizedPath.substring(1);
        }
        // Ensure src/ prefix for component files
        if (!normalizedPath.startsWith('src/') && 
            !normalizedPath.startsWith('public/') && 
            normalizedPath !== 'index.html' && 
            normalizedPath !== 'package.json' &&
            normalizedPath !== 'vite.config.js' &&
            normalizedPath !== 'tailwind.config.js' &&
            normalizedPath !== 'postcss.config.js') {
          normalizedPath = 'src/' + normalizedPath;
        }
        
        const fullPath = `/home/user/app/${normalizedPath}`;
        const isUpdate = global.existingFiles.has(normalizedPath);
        
        // Remove any CSS imports from JSX/JS files (we're using Tailwind)
        let fileContent = file.content;
        if (file.path.endsWith('.jsx') || file.path.endsWith('.js') || file.path.endsWith('.tsx') || file.path.endsWith('.ts')) {
          fileContent = fileContent.replace(/import\s+['"]\.\/[^'"]+\.css['"];?\s*\n?/g, '');
        }
        
        log.file('Writing file using E2B API', fullPath);
        
        try {
          // Use the correct E2B API - sandbox.files.write()
          await global.activeSandbox.files.write(fullPath, fileContent);
          log.file('Successfully wrote file', fullPath);
          
          // Update file cache
          if (global.sandboxState?.fileCache) {
            global.sandboxState.fileCache.files[normalizedPath] = {
              content: fileContent,
              lastModified: Date.now()
            };
            log.debug('Updated file cache', 'apply-ai-code', { path: normalizedPath });
          }
          
        } catch (writeError) {
          log.error('E2B file write error', 'apply-ai-code', { error: writeError });
          throw writeError;
        }
        
        
        if (isUpdate) {
          results.filesUpdated.push(normalizedPath);
        } else {
          results.filesCreated.push(normalizedPath);
          global.existingFiles.add(normalizedPath);
        }
      } catch (error) {
        results.errors.push(`Failed to create ${file.path}: ${(error as Error).message}`);
      }
    }
    
    // Only create App.jsx if it's not an edit and doesn't exist
    const appFileInParsed = parsed.files.some(f => {
      const normalized = f.path.replace(/^\//, '').replace(/^src\//, '');
      return normalized === 'App.jsx' || normalized === 'App.tsx';
    });
    
    const appFileExists = global.existingFiles.has('src/App.jsx') || 
                         global.existingFiles.has('src/App.tsx') ||
                         global.existingFiles.has('App.jsx') ||
                         global.existingFiles.has('App.tsx');
    
    if (!isEdit && !appFileInParsed && !appFileExists && parsed.files.length > 0) {
      // Find all component files
      const componentFiles = parsed.files.filter(f => 
        (f.path.endsWith('.jsx') || f.path.endsWith('.tsx')) &&
        f.path.includes('component')
      );
      
      // Generate imports for components
      const imports = componentFiles
        .filter(f => !f.path.includes('App.') && !f.path.includes('main.') && !f.path.includes('index.'))
        .map(f => {
          const pathParts = f.path.split('/');
          const fileName = pathParts[pathParts.length - 1];
          const componentName = fileName.replace(/\.(jsx|tsx)$/, '');
          // Fix import path - components are in src/components/
          const importPath = f.path.startsWith('src/') 
            ? f.path.replace('src/', './').replace(/\.(jsx|tsx)$/, '')
            : './' + f.path.replace(/\.(jsx|tsx)$/, '');
          return `import ${componentName} from '${importPath}';`;
        })
        .join('\n');
      
      // Find the main component
      const mainComponent = componentFiles.find(f => {
        const name = f.path.toLowerCase();
        return name.includes('header') || 
               name.includes('hero') ||
               name.includes('layout') ||
               name.includes('main') ||
               name.includes('home');
      }) || componentFiles[0];
      
      const mainComponentName = mainComponent 
        ? mainComponent.path.split('/').pop()?.replace(/\.(jsx|tsx)$/, '') 
        : null;
      
      // Create App.jsx with better structure
      const appContent = `import React from 'react';
${imports}

function App() {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      ${mainComponentName ? `<${mainComponentName} />` : '<div className="text-center">\n        <h1 className="text-4xl font-bold mb-4">Welcome to your React App</h1>\n        <p className="text-gray-400">Your components have been created but need to be added here.</p>\n      </div>'}
      {/* Generated components: ${componentFiles.map(f => f.path).join(', ')} */}
    </div>
  );
}

export default App;`;
      
      try {
        await global.activeSandbox.runCode(`
file_path = "/home/user/app/src/App.jsx"
file_content = """${appContent.replace(/"/g, '\\"').replace(/\n/g, '\\n')}"""

with open(file_path, 'w') as f:
    f.write(file_content)

print(f"Auto-generated: {file_path}")
        `);
        results.filesCreated.push('src/App.jsx (auto-generated)');
      } catch (error) {
        results.errors.push(`Failed to create App.jsx: ${(error as Error).message}`);
      }
      
      // Don't auto-generate App.css - we're using Tailwind CSS
      
      // Only create index.css if it doesn't exist
      const indexCssInParsed = parsed.files.some(f => {
        const normalized = f.path.replace(/^\//, '').replace(/^src\//, '');
        return normalized === 'index.css' || f.path === 'src/index.css';
      });
      
      const indexCssExists = global.existingFiles.has('src/index.css') || 
                            global.existingFiles.has('index.css');
      
      if (!isEdit && !indexCssInParsed && !indexCssExists) {
        try {
          await global.activeSandbox.runCode(`
file_path = "/home/user/app/src/index.css"
file_content = """@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  font-family: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif;
  line-height: 1.5;
  font-weight: 400;
  color-scheme: dark;
  
  color: rgba(255, 255, 255, 0.87);
  background-color: #0a0a0a;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-width: 320px;
  min-height: 100vh;
}"""

with open(file_path, 'w') as f:
    f.write(file_content)

print(f"Auto-generated: {file_path}")
          `);
          results.filesCreated.push('src/index.css (with Tailwind)');
        } catch (error) {
          results.errors.push('Failed to create index.css with Tailwind');
        }
      }
    }
    
    // Execute commands
    for (const cmd of parsed.commands) {
      try {
        await global.activeSandbox.runCode(`
import subprocess
os.chdir('/home/user/app')
result = subprocess.run(${JSON.stringify(cmd.split(' '))}, capture_output=True, text=True)
print(f"Executed: ${cmd}")
print(result.stdout)
if result.stderr:
    print(f"Errors: {result.stderr}")
        `);
        results.commandsExecuted.push(cmd);
      } catch (error) {
        results.errors.push(`Failed to execute ${cmd}: ${(error as Error).message}`);
      }
    }
    
    // Check for missing imports in App.jsx
    const missingImports: string[] = [];
    const appFile = parsed.files.find(f => 
      f.path === 'src/App.jsx' || f.path === 'App.jsx'
    );
    
    if (appFile) {
      // Extract imports from App.jsx
      const importRegex = /import\s+(?:\w+|\{[^}]+\})\s+from\s+['"]([^'"]+)['"]/g;
      let match;
      const imports: string[] = [];
      
      while ((match = importRegex.exec(appFile.content)) !== null) {
        const importPath = match[1];
        if (importPath.startsWith('./') || importPath.startsWith('../')) {
          imports.push(importPath);
        }
      }
      
      // Check if all imported files exist
      for (const imp of imports) {
        // Skip CSS imports for this check
        if (imp.endsWith('.css')) continue;
        
        // Convert import path to expected file paths
        const basePath = imp.replace('./', 'src/');
        const possiblePaths = [
          basePath + '.jsx',
          basePath + '.js',
          basePath + '/index.jsx',
          basePath + '/index.js'
        ];
        
        const fileExists = parsed.files.some(f => 
          possiblePaths.some(path => f.path === path)
        );
        
        if (!fileExists) {
          missingImports.push(imp);
        }
      }
    }
    
    // Prepare response
    const responseData: any = {
      success: true,
      results,
      explanation: parsed.explanation,
      structure: parsed.structure,
      message: `Applied ${results.filesCreated.length} files successfully`
    };
    
    // Handle missing imports automatically
    if (missingImports.length > 0) {
      log.warn('Missing imports detected', 'apply-ai-code', { imports: missingImports });
      
      // Automatically generate missing components
      try {
        log.debug('Auto-generating missing components', 'apply-ai-code');
        
        const autoCompleteResponse = await fetch(
          `${request.nextUrl.origin}/api/auto-complete-components`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              missingImports,
              model: 'claude-sonnet-4-20250514'
            })
          }
        );
        
        const autoCompleteData = await autoCompleteResponse.json();
        
        if (autoCompleteData.success) {
          responseData.autoCompleted = true;
          responseData.autoCompletedComponents = autoCompleteData.components;
          responseData.message = `Applied ${results.filesCreated.length} files + auto-generated ${autoCompleteData.files} missing components`;
          
          // Add auto-completed files to results
          results.filesCreated.push(...autoCompleteData.components);
        } else {
          // If auto-complete fails, still warn the user
          responseData.warning = `Missing ${missingImports.length} imported components: ${missingImports.join(', ')}`;
          responseData.missingImports = missingImports;
        }
      } catch (error) {
        log.error('Auto-complete failed', 'apply-ai-code', { error });
        responseData.warning = `Missing ${missingImports.length} imported components: ${missingImports.join(', ')}`;
        responseData.missingImports = missingImports;
      }
    }
    
    // Track applied files in conversation state
    if (global.conversationState && results.filesCreated.length > 0) {
      // Update the last message metadata with edited files
      const messages = global.conversationState.context.messages;
      if (messages.length > 0) {
        const lastMessage = messages[messages.length - 1];
        if (lastMessage.role === 'user') {
          lastMessage.metadata = {
            ...lastMessage.metadata,
            editedFiles: results.filesCreated
          };
        }
      }
      
      // Track applied code in project evolution
      if (global.conversationState.context.projectEvolution) {
        global.conversationState.context.projectEvolution.majorChanges.push({
          timestamp: Date.now(),
          description: parsed.explanation || 'Code applied',
          filesAffected: results.filesCreated
        });
      }
      
      // Update last updated timestamp
      global.conversationState.lastUpdated = Date.now();
      
      log.debug('Updated conversation state with applied files', 'apply-ai-code', { files: results.filesCreated });
    }
    
    return NextResponse.json(responseData);
    
  } catch (error) {
    log.error('Apply AI code error', 'apply-ai-code', { error });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to parse AI code' },
      { status: 500 }
    );
  }
}