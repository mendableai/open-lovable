'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Copy, 
  Download, 
  Eye, 
  Edit3, 
  FileText, 
  Code as CodeIcon,
  CheckCircle,
  ExternalLink
} from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface CodeFile {
  path: string;
  content: string;
}

interface CodeEditorProps {
  files: CodeFile[];
  onFileSelect?: (file: CodeFile) => void;
  onDownload?: () => void;
  sandboxUrl?: string;
}

export default function CodeEditor({ files, onFileSelect, onDownload, sandboxUrl }: CodeEditorProps) {
  const [selectedFile, setSelectedFile] = useState<CodeFile | null>(files.length > 0 ? files[0] : null);
  const [copied, setCopied] = useState<string | null>(null);

  const handleFileSelect = (file: CodeFile) => {
    setSelectedFile(file);
    onFileSelect?.(file);
  };

  const handleCopy = async (content: string, fileName: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(fileName);
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const getFileIcon = (path: string) => {
    if (path.includes('.jsx') || path.includes('.tsx')) return <CodeIcon className="w-4 h-4 text-blue-600" />;
    if (path.includes('.css')) return <FileText className="w-4 h-4 text-purple-600" />;
    if (path.includes('.json')) return <FileText className="w-4 h-4 text-yellow-600" />;
    return <FileText className="w-4 h-4 text-gray-600" />;
  };

  const getLanguage = (path: string) => {
    if (path.includes('.jsx') || path.includes('.js')) return 'jsx';
    if (path.includes('.tsx') || path.includes('.ts')) return 'typescript';
    if (path.includes('.css')) return 'css';
    if (path.includes('.json')) return 'json';
    if (path.includes('.html')) return 'html';
    return 'text';
  };

  if (files.length === 0) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/20 p-8 text-center">
        <CodeIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Code Generated Yet</h3>
        <p className="text-gray-500">Start chatting with AI to generate your website code</p>
      </div>
    );
  }

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/20 shadow-xl overflow-hidden">
      {/* Header */}
      <div className="border-b border-gray-200 bg-gray-50/50 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <CodeIcon className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Code Editor</h3>
            <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
              {files.length} file{files.length !== 1 ? 's' : ''}
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            {sandboxUrl && (
              <Button size="sm" variant="outline" asChild>
                <a href={sandboxUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Live Preview
                </a>
              </Button>
            )}
            
            <Button size="sm" variant="outline" onClick={onDownload}>
              <Download className="w-4 h-4 mr-2" />
              Download All
            </Button>
          </div>
        </div>
      </div>

      <div className="flex h-[600px]">
        {/* File Sidebar */}
        <div className="w-64 border-r border-gray-200 bg-gray-50/30 overflow-y-auto">
          <div className="p-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Generated Files</h4>
            <div className="space-y-1">
              {files.map((file, index) => (
                <button
                  key={index}
                  onClick={() => handleFileSelect(file)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    selectedFile?.path === file.path
                      ? 'bg-blue-100 border border-blue-200'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    {getFileIcon(file.path)}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${
                        selectedFile?.path === file.path ? 'text-blue-900' : 'text-gray-900'
                      }`}>
                        {file.path.split('/').pop()}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {file.path}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Code Editor */}
        <div className="flex-1 flex flex-col">
          {selectedFile ? (
            <>
              {/* File Header */}
              <div className="border-b border-gray-200 bg-gray-50/50 px-6 py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getFileIcon(selectedFile.path)}
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">{selectedFile.path.split('/').pop()}</h4>
                      <p className="text-xs text-gray-500">{selectedFile.path}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleCopy(selectedFile.content, selectedFile.path)}
                      className="h-8 px-2"
                    >
                      {copied === selectedFile.path ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                    
                    <Button size="sm" variant="ghost" className="h-8 px-2">
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Code Content */}
              <div className="flex-1 overflow-auto">
                <SyntaxHighlighter
                  language={getLanguage(selectedFile.path)}
                  style={tomorrow}
                  customStyle={{
                    margin: 0,
                    padding: '1rem',
                    fontSize: '14px',
                    lineHeight: '1.5',
                    backgroundColor: 'transparent'
                  }}
                  showLineNumbers
                  wrapLines
                >
                  {selectedFile.content}
                </SyntaxHighlighter>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <CodeIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Select a file to view its code</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}