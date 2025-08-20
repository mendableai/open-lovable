import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'edge';
import type { SandboxState } from '@/types/sandbox';
import type { ConversationState } from '@/types/conversation';

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
      console.log(`[parseAIResponse] Replacing incomplete ${filePath} with complete version`);
    } else if (existing.isComplete && hasClosingTag && content.length > existing.content.length) {
      shouldReplace = true; // Replace with longer complete version
      console.log(`[parseAIResponse] Replacing ${filePath} with longer complete version`);
    } else if (!existing.isComplete && !hasClosingTag && content.length > existing.content.length) {
      shouldReplace = true; // Both incomplete, keep longer one
    }
    
    if (shouldReplace) {
      // Additional validation: reject obviously broken content
      if (content.includes('...') && !content.includes('...props') && !content.includes('...rest')) {
        console.warn(`[parseAIResponse] Warning: ${filePath} contains ellipsis, may be truncated`);
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
      console.log(`[parseAIResponse] Warning: File ${path} appears to be truncated (no closing tag)`);
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
    if (!globalThis.existingFiles) {
      globalThis.existingFiles = new Set<string>();
    }
    
    // If no active sandbox, just return parsed results
    if (!globalThis.activeSandbox) {
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
    console.log('[apply-ai-code] Applying code to sandbox...');
    console.log('[apply-ai-code] Is edit mode:', isEdit);
    console.log('[apply-ai-code] Files to write:', parsed.files.map(f => f.path));
    console.log('[apply-ai-code] Existing files:', Array.from(globalThis.existingFiles));
    
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
      console.log('[apply-ai-code] Installing packages from XML tags and tool calls:', uniquePackages);
      
      try {
        const installResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/install-packages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ packages: uniquePackages })
        });
        
        if (installResponse.ok) {
          const installResult = await installResponse.json();
          console.log('[apply-ai-code] Package installation result:', installResult);
          
          if (installResult.installed && installResult.installed.length > 0) {
            results.packagesInstalled = installResult.installed;
          }
          if (installResult.failed && installResult.failed.length > 0) {
            results.packagesFailed = installResult.failed;
          }
        }
      } catch (error) {
        console.error('[apply-ai-code] Error installing packages:', error);
      }
    } else {
      // Fallback to detecting packages from code
      console.log('[apply-ai-code] No packages provided, detecting from generated code...');
      console.log('[apply-ai-code] Number of files to scan:', parsed.files.length);
      
      // Filter out config files first
      const configFiles = ['tailwind.config.js', 'vite.config.js', 'package.json', 'package-lock.json', 'tsconfig.json', 'postcss.config.js'];
      const codeFiles = parsed.files.filter(f => !configFiles.includes(f.path.split('/').pop() || ''));
      
      // Extract packages from imports in code files
      const importRegex = /import\s+(?:(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)\s*,?\s*)?(?:from\s+)?['"]([^'"]+)['"]/g;
      const detectedPackages = new Set<string>();
      
      for (const file of codeFiles) {
        let match;
        while ((match = importRegex.exec(file.content)) !== null) {
          const imp = match[1];
          if (!imp.startsWith('.') && !imp.startsWith('/')) {
            // Handle scoped packages
            const pkgName = imp.startsWith('@') ? imp.split('/').slice(0, 2).join('/') : imp.split('/')[0];
            detectedPackages.add(pkgName);
          }
        }
      }
      
      if (detectedPackages.size > 0) {
        console.log('[apply-ai-code] Detected packages from code:', Array.from(detectedPackages));
        try {
          const installResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/install-packages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ packages: Array.from(detectedPackages) })
          });
          const installResult = await installResponse.json();
          results.packagesInstalled = installResult.installed || [];
          results.packagesFailed = installResult.failed || [];
        } catch (e) {
          console.error('[apply-ai-code] Failed to install detected packages:', e);
        }
      }
    }

    // For build-time safety, return the parsed results when sandbox exists.
    return NextResponse.json({
      success: true,
      results,
      explanation: parsed.explanation,
      structure: parsed.structure,
      parsedFiles: parsed.files
    });
  } catch (error) {
    console.error('[apply-ai-code] Error:', error);
    return NextResponse.json({
      success: false,
      error: (error as Error).message
    }, { status: 500 });
  }
}