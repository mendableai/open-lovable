'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import ChatMessage from '@/components/ChatMessage';
import CodeEditor from '@/components/CodeEditor';
import SandboxManager from '@/components/SandboxManager';
import DemoWebsite from '@/components/DemoWebsite';
import LoadingSpinner, { LoadingDots } from '@/components/LoadingSpinner';
import { 
  MessageSquare, 
  Code, 
  Play, 
  Download, 
  Globe, 
  Sparkles, 
  Zap, 
  CheckCircle,
  ArrowRight,
  Github,
  ExternalLink,
  Settings,
  RefreshCw,
  FileText,
  FolderOpen,
  Terminal,
  Bot,
  User
} from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  type?: 'text' | 'code' | 'status';
}

interface SandboxStatus {
  id?: string;
  status: 'idle' | 'creating' | 'running' | 'error' | 'stopped';
  url?: string;
  files?: any[];
  createdAt?: Date;
}

interface CodeFile {
  path: string;
  content: string;
}

export default function Page() {
  const [status, setStatus] = useState<{ ok: boolean; detail?: any } | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I\'m your AI website builder. Tell me what kind of website you\'d like to create, or paste a URL to clone an existing site.\n\nI can help you build:\n• Landing pages and portfolios\n• E-commerce sites\n• Business websites\n• Personal blogs\n• And much more!',
      timestamp: new Date(),
      type: 'text'
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedModel, setSelectedModel] = useState('groq/kimi-2-8b');
  const [sandboxStatus, setSandboxStatus] = useState<SandboxStatus>({ status: 'idle' });
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'chat' | 'preview' | 'files' | 'code'>('chat');
  const [selectedFile, setSelectedFile] = useState<CodeFile | null>(null);
  const [showDemos, setShowDemos] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch('/api/health', { cache: 'no-store' });
        const json = await res.json();
        if (mounted) setStatus({ ok: json.success === true, detail: json });
      } catch (e) {
        if (mounted) setStatus({ ok: false, detail: { error: (e as Error).message } });
      }
    })();
    return () => { mounted = false };
  }, []);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isGenerating) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date(),
      type: 'text'
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsGenerating(true);

    // Add typing indicator
    const typingMessage: ChatMessage = {
      id: 'typing',
      role: 'assistant',
      content: '🤔 Thinking...',
      timestamp: new Date(),
      type: 'status'
    };

    setMessages(prev => [...prev, typingMessage]);

    try {
      // Create sandbox if needed
      if (sandboxStatus.status === 'idle') {
        setSandboxStatus({ status: 'creating', createdAt: new Date() });
        
        const sandboxRes = await fetch('/api/create-ai-sandbox', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: inputValue })
        });

        if (sandboxRes.ok) {
          const sandboxData = await sandboxRes.json();
          setSandboxStatus({ 
            status: 'running', 
            id: sandboxData.sandboxId,
            url: sandboxData.url,
            createdAt: new Date()
          });
        }
      }

      // Generate code
      const response = await fetch('/api/generate-ai-code-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: inputValue,
          model: selectedModel,
          context: {
            sandboxId: sandboxStatus.id,
            currentFiles: {},
            conversationContext: {
              scrapedWebsites: [],
              currentProject: 'AI Website Builder'
            }
          },
          isEdit: false
        })
      });

      if (response.ok) {
        const reader = response.body?.getReader();
        if (reader) {
          let codeBuffer = '';
          
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = new TextDecoder().decode(value);
            const lines = chunk.split('\n');
            
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.slice(6));
                  
                  if (data.type === 'stream') {
                    codeBuffer += data.text;
                    setGeneratedCode(codeBuffer);
                  } else if (data.type === 'status') {
                    // Update typing message with status
                    setMessages(prev => prev.map(msg => 
                      msg.id === 'typing' 
                        ? { ...msg, content: data.message }
                        : msg
                    ));
                  } else if (data.type === 'complete') {
                    // Remove typing message and add completion
                    setMessages(prev => prev.filter(msg => msg.id !== 'typing'));
                    
                    const completionMessage: ChatMessage = {
                      id: Date.now().toString(),
                      role: 'assistant',
                      content: `I've generated your website! Here's what I created:\n\n${data.explanation || 'Your website is ready to preview.'}\n\nYou can now:\n• View the generated code in the Code tab\n• See a live preview in the Preview tab\n• Download all files as a ZIP\n• Continue chatting to make modifications`,
                      timestamp: new Date(),
                      type: 'text'
                    };
                    
                    setMessages(prev => [...prev, completionMessage]);
                    setActiveTab('code');
                  }
                } catch (e) {
                  // Skip invalid JSON
                }
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error generating code:', error);
      
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error while generating your website. Please try again.',
        timestamp: new Date(),
        type: 'text'
      };
      
      setMessages(prev => prev.filter(msg => msg.id !== 'typing'));
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const extractFilesFromCode = (code: string): CodeFile[] => {
    const fileRegex = /<file path="([^"]+)">([\s\S]*?)<\/file>/g;
    const files: CodeFile[] = [];
    let match;
    
    while ((match = fileRegex.exec(code)) !== null) {
      files.push({
        path: match[1],
        content: match[2].trim()
      });
    }
    
    return files;
  };

  const handleFileSelect = (file: CodeFile) => {
    setSelectedFile(file);
  };

  const handleDownloadFiles = async () => {
    const files = extractFilesFromCode(generatedCode);
    if (files.length === 0) return;

    try {
      const response = await fetch('/api/create-zip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'website-files.zip';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Failed to download files:', error);
    }
  };

  const handleSandboxCreate = async (prompt: string) => {
    setSandboxStatus({ status: 'creating', createdAt: new Date() });
    
    try {
      const response = await fetch('/api/create-ai-sandbox', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });

      if (response.ok) {
        const data = await response.json();
        setSandboxStatus({ 
          status: 'running', 
          id: data.sandboxId,
          url: data.url,
          createdAt: new Date()
        });
      }
    } catch (error) {
      console.error('Failed to create sandbox:', error);
      setSandboxStatus({ status: 'error' });
    }
  };

  const handleSandboxStop = async () => {
    if (!sandboxStatus.id) return;

    try {
      await fetch('/api/kill-sandbox', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sandboxId: sandboxStatus.id })
      });
      
      setSandboxStatus(prev => ({ ...prev, status: 'stopped' }));
    } catch (error) {
      console.error('Failed to stop sandbox:', error);
    }
  };

  const handleSandboxRestart = async () => {
    await handleSandboxCreate('Restart sandbox environment');
  };

  const handleTryDemo = (demoType: string) => {
    const demoPrompts = {
      landing: 'Create a modern, responsive landing page for a tech startup with a hero section, features grid, testimonials, and contact form. Use a clean, professional design with blue and white color scheme.',
      portfolio: 'Build a professional portfolio website for a web developer with an about section, skills display, project gallery, and contact information. Use a modern, minimalist design.',
      ecommerce: 'Create an e-commerce website with a product grid, shopping cart functionality, product detail pages, and a checkout flow. Use a clean, user-friendly design.',
      blog: 'Design a personal blog website with article layouts, category navigation, search functionality, and a clean reading experience. Use elegant typography and spacing.'
    };

    const prompt = demoPrompts[demoType as keyof typeof demoPrompts] || demoPrompts.landing;
    setInputValue(prompt);
    setShowDemos(false);
    
    // Scroll to chat
    document.getElementById('chat-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  const files = extractFilesFromCode(generatedCode);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <header className="border-b border-white/20 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Open Lovable
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <div className={`w-2 h-2 rounded-full ${status?.ok ? 'bg-green-500' : 'bg-yellow-500'}`} />
                <span>{status?.ok ? 'All systems operational' : 'Checking status...'}</span>
              </div>
              
              <Button variant="outline" size="sm" onClick={() => setShowDemos(!showDemos)}>
                <Sparkles className="w-4 h-4 mr-2" />
                Try Demos
              </Button>
              
              <Button variant="outline" size="sm" asChild>
                <a href="https://github.com/firecrawl/open-lovable" target="_blank" rel="noopener noreferrer">
                  <Github className="w-4 h-4 mr-2" />
                  GitHub
                </a>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <section className="text-center mb-12">
          <h2 className="text-4xl sm:text-6xl font-bold text-gray-900 mb-6">
            Build Beautiful Websites
            <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              with AI Magic
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Chat with AI to create stunning React applications in seconds. 
            Clone existing websites, build from scratch, or iterate on your ideas.
          </p>
          
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            <div className="flex items-center space-x-2 bg-white/60 backdrop-blur-sm rounded-full px-4 py-2 border border-white/20">
              <Zap className="w-4 h-4 text-yellow-500" />
              <span className="text-sm font-medium">Instant Generation</span>
            </div>
            <div className="flex items-center space-x-2 bg-white/60 backdrop-blur-sm rounded-full px-4 py-2 border border-white/20">
              <Code className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-medium">React + Tailwind</span>
            </div>
            <div className="flex items-center space-x-2 bg-white/60 backdrop-blur-sm rounded-full px-4 py-2 border border-white/20">
              <Globe className="w-4 h-4 text-green-500" />
              <span className="text-sm font-medium">Live Preview</span>
            </div>
          </div>

          {/* Demo Section Toggle */}
          <div className="flex justify-center">
            <Button
              onClick={() => setShowDemos(!showDemos)}
              variant="outline"
              size="lg"
              className="bg-white/80 backdrop-blur-sm hover:bg-white/90"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              {showDemos ? 'Hide' : 'Show'} Demo Examples
            </Button>
          </div>
        </section>

        {/* Demo Section */}
        {showDemos && (
          <section className="mb-16">
            <DemoWebsite onTryDemo={handleTryDemo} />
          </section>
        )}

        {/* Main Interface */}
        <div id="chat-section" className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Chat Panel */}
          <div className="lg:col-span-2 space-y-6">
            {/* Chat Messages */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/20 shadow-xl p-6 h-[600px] flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <MessageSquare className="w-5 h-5 mr-2 text-blue-600" />
                  AI Chat
                </h3>
                <div className="flex items-center space-x-2">
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="w-40 px-3 py-2 border border-gray-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="groq/kimi-2-8b">Kimi 2 (Fast)</option>
                    <option value="anthropic/claude-3-5-sonnet">Claude 3.5</option>
                    <option value="openai/gpt-5">GPT-5</option>
                    <option value="google/gemini-1.5-pro">Gemini 1.5</option>
                  </select>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
                {messages.map((message) => (
                  <ChatMessage
                    key={message.id}
                    {...message}
                    onFileSelect={handleFileSelect}
                  />
                ))}
                
                {/* Loading indicator */}
                {isGenerating && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3 shadow-sm">
                      <LoadingDots text="AI is generating your website..." />
                    </div>
                  </div>
                )}
              </div>

              {/* Input */}
              <div className="flex space-x-3">
                <Textarea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Describe the website you want to build, or paste a URL to clone..."
                  className="flex-1 resize-none"
                  rows={3}
                  disabled={isGenerating}
                />
                <Button 
                  onClick={handleSendMessage} 
                  disabled={!inputValue.trim() || isGenerating}
                  className="px-6"
                >
                  {isGenerating ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <ArrowRight className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Advanced Options */}
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-white/20 p-4">
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                <Settings className="w-4 h-4" />
                <span>Advanced Options</span>
              </button>
              
              {showAdvanced && (
                <div className="mt-4 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">AI Model</Label>
                      <select
                        value={selectedModel}
                        onChange={(e) => setSelectedModel(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="groq/kimi-2-8b">Kimi 2 (Fast)</option>
                        <option value="anthropic/claude-3-5-sonnet">Claude 3.5</option>
                        <option value="openai/gpt-5">GPT-5</option>
                        <option value="google/gemini-1.5-pro">Gemini 1.5</option>
                      </select>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium">Sandbox Status</Label>
                      <div className="flex items-center space-x-2 mt-1">
                        <div className={`w-2 h-2 rounded-full ${
                          sandboxStatus.status === 'running' ? 'bg-green-500' : 
                          sandboxStatus.status === 'creating' ? 'bg-yellow-500' : 
                          sandboxStatus.status === 'stopped' ? 'bg-gray-400' : 'bg-gray-400'
                        }`} />
                        <span className="text-sm text-gray-600 capitalize">{sandboxStatus.status}</span>
                      </div>
                    </div>
                  </div>
                  
                  {sandboxStatus.url && (
                    <div className="flex items-center space-x-2">
                      <Label className="text-sm font-medium">Preview URL:</Label>
                      <a 
                        href={sandboxStatus.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
                      >
                        {sandboxStatus.url}
                        <ExternalLink className="w-3 h-3 ml-1" />
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Panel */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tabs */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/20 shadow-xl">
              <div className="flex border-b border-gray-200">
                <button
                  onClick={() => setActiveTab('chat')}
                  className={`flex-1 px-4 py-3 text-sm font-medium rounded-tl-2xl transition-colors ${
                    activeTab === 'chat' 
                      ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <MessageSquare className="w-4 h-4 inline mr-2" />
                  Chat
                </button>
                <button
                  onClick={() => setActiveTab('preview')}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                    activeTab === 'preview' 
                      ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Play className="w-4 h-4 inline mr-2" />
                  Preview
                </button>
                <button
                  onClick={() => setActiveTab('files')}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                    activeTab === 'files' 
                      ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <FileText className="w-4 h-4 inline mr-2" />
                  Files
                </button>
                <button
                  onClick={() => setActiveTab('code')}
                  className={`flex-1 px-4 py-3 text-sm font-medium rounded-tr-2xl transition-colors ${
                    activeTab === 'code' 
                      ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Code className="w-4 h-4 inline mr-2" />
                  Code
                </button>
              </div>

              <div className="p-6">
                {activeTab === 'chat' && (
                  <div className="text-center text-gray-500 py-8">
                    <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>Start chatting with AI to build your website</p>
                  </div>
                )}

                {activeTab === 'preview' && (
                  <div className="space-y-4">
                    {sandboxStatus.url ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-gray-900">Live Preview</h4>
                          <Button size="sm" variant="outline" asChild>
                            <a href={sandboxStatus.url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="w-4 h-4 mr-2" />
                              Open
                            </a>
                          </Button>
                        </div>
                        <div className="bg-gray-900 rounded-lg p-4">
                          <div className="flex items-center space-x-2 mb-3">
                            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          </div>
                          <div className="text-green-400 text-sm font-mono">
                            {sandboxStatus.url}
                          </div>
                        </div>
                      </div>
                    ) : sandboxStatus.status === 'creating' ? (
                      <div className="text-center text-gray-500 py-8">
                        <LoadingSpinner size="lg" text="Creating sandbox..." />
                      </div>
                    ) : (
                      <div className="text-center text-gray-500 py-8">
                        <Play className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <p>Generate code to see preview</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'files' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-gray-900">Generated Files</h4>
                      <Button size="sm" variant="outline" disabled={files.length === 0} onClick={handleDownloadFiles}>
                        <Download className="w-4 h-4 mr-2" />
                        Download ZIP
                      </Button>
                    </div>
                    
                    {files.length > 0 ? (
                      <div className="space-y-3">
                        {files.map((file, index) => (
                          <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                            <FileText className="w-4 h-4 text-blue-600" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{file.path}</p>
                              <p className="text-xs text-gray-500">
                                {file.content.length} characters
                              </p>
                            </div>
                            <Button size="sm" variant="ghost" onClick={() => handleFileSelect(file)}>
                              <FolderOpen className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : isGenerating ? (
                      <div className="text-center text-gray-500 py-8">
                        <LoadingSpinner size="lg" text="Generating files..." />
                      </div>
                    ) : (
                      <div className="text-center text-gray-500 py-8">
                        <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <p>No files generated yet</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'code' && (
                  <CodeEditor
                    files={files}
                    onFileSelect={handleFileSelect}
                    onDownload={handleDownloadFiles}
                    sandboxUrl={sandboxStatus.url}
                  />
                )}
              </div>
            </div>

            {/* Sandbox Manager */}
            <SandboxManager
              onSandboxCreate={handleSandboxCreate}
              onSandboxStop={handleSandboxStop}
              onSandboxRestart={handleSandboxRestart}
              onFilesDownload={handleDownloadFiles}
            />

            {/* Quick Actions */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/20 p-6 space-y-4">
              <h4 className="font-medium text-gray-900">Quick Actions</h4>
              
              <div className="space-y-3">
                <Button variant="outline" className="w-full justify-start" disabled={files.length === 0}>
                  <Terminal className="w-4 h-4 mr-2" />
                  Run in Sandbox
                </Button>
                
                <Button variant="outline" className="w-full justify-start" disabled={files.length === 0}>
                  <Globe className="w-4 h-4 mr-2" />
                  Deploy
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <section className="mt-20 text-center">
          <h3 className="text-3xl font-bold text-gray-900 mb-12">Why Choose Open Lovable?</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/20 p-8 text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Sparkles className="w-8 h-8 text-blue-600" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-4">AI-Powered Generation</h4>
              <p className="text-gray-600">
                Advanced AI models understand your requirements and generate production-ready React code with Tailwind CSS.
              </p>
            </div>
            
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/20 p-8 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Globe className="w-8 h-8 text-green-600" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-4">Live Preview</h4>
              <p className="text-gray-600">
                See your website come to life instantly with live sandbox previews and real-time updates.
              </p>
            </div>
            
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/20 p-8 text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Code className="w-8 h-8 text-purple-600" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-4">Modern Stack</h4>
              <p className="text-gray-600">
                Built with React 19, Tailwind CSS, and Vite for the best developer experience and performance.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

