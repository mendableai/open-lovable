'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, CheckCircle, Code as CodeIcon, ExternalLink } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface ChatMessageProps {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  type?: 'text' | 'code' | 'status';
  onFileSelect?: (file: any) => void;
}

export default function ChatMessage({ 
  id, 
  role, 
  content, 
  timestamp, 
  type = 'text',
  onFileSelect 
}: ChatMessageProps) {
  const [copied, setCopied] = useState(false);
  const [showFullCode, setShowFullCode] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const extractCodeBlocks = (text: string) => {
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    const blocks: { language: string; code: string }[] = [];
    let match;
    
    while ((match = codeBlockRegex.exec(text)) !== null) {
      blocks.push({
        language: match[1] || 'text',
        code: match[2].trim()
      });
    }
    
    return blocks;
  };

  const extractFiles = (text: string) => {
    const fileRegex = /<file path="([^"]+)">([\s\S]*?)<\/file>/g;
    const files: { path: string; content: string }[] = [];
    let match;
    
    while ((match = fileRegex.exec(text)) !== null) {
      files.push({
        path: match[1],
        content: match[2].trim()
      });
    }
    
    return files;
  };

  const codeBlocks = extractCodeBlocks(content);
  const files = extractFiles(content);
  const hasCode = codeBlocks.length > 0 || files.length > 0;
  const isLongMessage = content.length > 500;

  const renderContent = () => {
    if (type === 'status') {
      return (
        <div className="flex items-center space-x-2 text-gray-600">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
          <span>{content}</span>
        </div>
      );
    }

    if (hasCode) {
      return (
        <div className="space-y-4">
          {/* Text content */}
          {content.replace(/```[\s\S]*?```/g, '').replace(/<file[\s\S]*?<\/file>/g, '').trim() && (
            <div className="whitespace-pre-wrap text-gray-700">
              {content.replace(/```[\s\S]*?```/g, '').replace(/<file[\s\S]*?<\/file>/g, '').trim()}
            </div>
          )}

          {/* Code blocks */}
          {codeBlocks.map((block, index) => (
            <div key={index} className="relative group">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono text-gray-500 uppercase">
                  {block.language}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleCopy()}
                  className="h-6 px-2 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  {copied ? (
                    <CheckCircle className="w-3 h-3 text-green-600" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </Button>
              </div>
              <SyntaxHighlighter
                language={block.language}
                style={tomorrow}
                customStyle={{
                  margin: 0,
                  padding: '1rem',
                  fontSize: '13px',
                  lineHeight: '1.4',
                  borderRadius: '0.5rem',
                  backgroundColor: '#1e1e1e'
                }}
                showLineNumbers
              >
                {block.code}
              </SyntaxHighlighter>
            </div>
          ))}

          {/* File blocks */}
          {files.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-gray-900 flex items-center">
                  <CodeIcon className="w-4 h-4 mr-2" />
                  Generated Files ({files.length})
                </h4>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowFullCode(!showFullCode)}
                >
                  {showFullCode ? 'Hide' : 'Show'} Code
                </Button>
              </div>
              
              {showFullCode && (
                <div className="space-y-3">
                  {files.map((file, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                      <div className="bg-gray-50 px-3 py-2 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-mono text-gray-700">{file.path}</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onFileSelect?.(file)}
                            className="h-6 px-2"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                      <SyntaxHighlighter
                        language={file.path.includes('.jsx') ? 'jsx' : 'text'}
                        style={tomorrow}
                        customStyle={{
                          margin: 0,
                          padding: '1rem',
                          fontSize: '12px',
                          lineHeight: '1.3',
                          backgroundColor: '#f8f9fa'
                        }}
                        showLineNumbers
                      >
                        {file.content}
                      </SyntaxHighlighter>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="whitespace-pre-wrap">
        {isLongMessage && !showFullCode ? (
          <>
            {content.substring(0, 500)}...
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFullCode(true)}
              className="p-0 h-auto text-blue-600 hover:text-blue-800"
            >
              Show more
            </Button>
          </>
        ) : (
          <>
            {content}
            {isLongMessage && showFullCode && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFullCode(false)}
                className="p-0 h-auto text-blue-600 hover:text-blue-800 ml-2"
              >
                Show less
              </Button>
            )}
          </>
        )}
      </div>
    );
  };

  return (
    <div className={`flex ${role === 'user' ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 ${
          role === 'user'
            ? 'bg-blue-600 text-white'
            : 'bg-white border border-gray-200 text-gray-900 shadow-sm'
        }`}
      >
        {renderContent()}
        
        <div className={`text-xs mt-3 ${
          role === 'user' ? 'text-blue-100' : 'text-gray-500'
        }`}>
          {timestamp.toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </div>
      </div>
    </div>
  );
}