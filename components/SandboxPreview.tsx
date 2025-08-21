import { useState, useEffect } from 'react';
import { Loader2, ExternalLink, RefreshCw, Terminal } from 'lucide-react';

interface SandboxPreviewProps {
  sandboxId: string;
  port: number;
  type: 'vite' | 'nextjs' | 'console';
  output?: string;
  isLoading?: boolean;
  status?: 'creating' | 'active' | 'idle' | 'error' | 'terminated';
  lastActivity?: string;
  metrics?: {
    cpu: number;
    memory: number;
    disk: number;
  };
  onRefresh?: () => void;
  onRestart?: () => void;
}

export default function SandboxPreview({ 
  sandboxId, 
  port, 
  type, 
  output,
  isLoading = false,
  status = 'active',
  lastActivity,
  metrics,
  onRefresh,
  onRestart
}: SandboxPreviewProps) {
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [showConsole, setShowConsole] = useState(false);
  const [showMetrics, setShowMetrics] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  const [isIframeLoading, setIsIframeLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  useEffect(() => {
    if (sandboxId && type !== 'console') {
      // In production, this would be the actual E2B sandbox URL
      // Format: https://{sandboxId}-{port}.e2b.dev
      setPreviewUrl(`https://${sandboxId}-${port}.e2b.dev`);
    }
  }, [sandboxId, port, type]);

  const handleRefresh = () => {
    setIframeKey(prev => prev + 1);
    setIsIframeLoading(true);
    setLastRefresh(new Date());
    if (onRefresh) {
      onRefresh();
    }
  };

  const handleRestart = async () => {
    if (onRestart) {
      setIsIframeLoading(true);
      await onRestart();
      // Auto refresh after restart
      setTimeout(() => {
        handleRefresh();
      }, 3000);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-400 bg-green-400/20';
      case 'creating': return 'text-yellow-400 bg-yellow-400/20';
      case 'idle': return 'text-blue-400 bg-blue-400/20';
      case 'error': return 'text-red-400 bg-red-400/20';
      case 'terminated': return 'text-gray-400 bg-gray-400/20';
      default: return 'text-gray-400 bg-gray-400/20';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'نشط';
      case 'creating': return 'إنشاء';
      case 'idle': return 'خامل';
      case 'error': return 'خطأ';
      case 'terminated': return 'متوقف';
      default: return 'غير معروف';
    }
  };

  if (type === 'console') {
    return (
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <div className="font-mono text-sm whitespace-pre-wrap text-gray-300">
          {output || 'No output yet...'}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Enhanced Preview Controls */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-lg p-4 border border-gray-700 shadow-lg">
        {/* Top Row: Type, Status, and URL */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-white">
              {type === 'vite' ? '⚡ Vite' : '▲ Next.js'} Sandbox
            </span>
            <div className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(status)}`}>
              {getStatusText(status)}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {metrics && (
              <button
                onClick={() => setShowMetrics(!showMetrics)}
                className="p-2 hover:bg-gray-700 rounded transition-colors text-gray-400 hover:text-white"
                title="عرض المقاييس"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </button>
            )}
            <button
              onClick={() => setShowConsole(!showConsole)}
              className={`p-2 hover:bg-gray-700 rounded transition-colors ${showConsole ? 'text-blue-400 bg-blue-400/20' : 'text-gray-400 hover:text-white'}`}
              title="عرض وحدة التحكم"
            >
              <Terminal className="w-4 h-4" />
            </button>
            {onRestart && (
              <button
                onClick={handleRestart}
                className="p-2 hover:bg-gray-700 rounded transition-colors text-gray-400 hover:text-orange-400"
                title="إعادة تشغيل الخادم"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            )}
            <button
              onClick={handleRefresh}
              className="p-2 hover:bg-gray-700 rounded transition-colors text-gray-400 hover:text-green-400"
              title="تحديث المعاينة"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <a
              href={previewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 hover:bg-gray-700 rounded transition-colors text-gray-400 hover:text-blue-400"
              title="فتح في نافذة جديدة"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
        
        {/* URL and Last Activity */}
        <div className="flex items-center justify-between text-xs text-gray-400">
          <code className="bg-gray-900 px-3 py-1.5 rounded text-blue-400 font-mono">
            {previewUrl || 'جاري تحديد الرابط...'}
          </code>
          <div className="flex items-center gap-4">
            {lastRefresh && (
              <span className="text-gray-500">
                آخر تحديث: {lastRefresh.toLocaleTimeString('ar-EG')}
              </span>
            )}
            {lastActivity && (
              <span className="text-gray-500">
                آخر نشاط: {new Date(lastActivity).toLocaleTimeString('ar-EG')}
              </span>
            )}
          </div>
        </div>
        
        {/* Metrics Bar */}
        {showMetrics && metrics && (
          <div className="mt-3 pt-3 border-t border-gray-700">
            <div className="grid grid-cols-3 gap-4 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                <span className="text-gray-400">CPU:</span>
                <span className="font-mono text-white">{metrics.cpu.toFixed(1)}%</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-400"></div>
                <span className="text-gray-400">ذاكرة:</span>
                <span className="font-mono text-white">{metrics.memory.toFixed(1)}%</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                <span className="text-gray-400">تخزين:</span>
                <span className="font-mono text-white">{metrics.disk.toFixed(1)}%</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Preview */}
      <div className="relative bg-gray-900 rounded-lg overflow-hidden border border-gray-700">
        {(isLoading || isIframeLoading || status === 'creating') && (
          <div className="absolute inset-0 bg-gray-900/90 backdrop-blur-sm flex items-center justify-center z-10">
            <div className="text-center bg-gray-800 rounded-lg p-6 border border-gray-700 shadow-xl">
              <div className="relative mb-4">
                <Loader2 className="w-12 h-12 animate-spin mx-auto text-blue-400" />
                <div className="absolute inset-0 bg-blue-400/20 rounded-full animate-ping"></div>
              </div>
              <p className="text-lg font-medium text-white mb-2">
                {status === 'creating' 
                  ? 'إنشاء Sandbox جديد...'
                  : type === 'vite' 
                    ? 'تشغيل خادم Vite...'
                    : 'تشغيل خادم Next.js...'
                }
              </p>
              <p className="text-sm text-gray-400">
                {status === 'creating' 
                  ? 'جاري إعداد البيئة وتثبيت المكتبات'
                  : 'جاري تحضير المعاينة المباشرة'
                }
              </p>
              
              {/* Loading Animation */}
              <div className="flex items-center justify-center mt-4 gap-1">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 0.2}s` }}
                  ></div>
                ))}
              </div>
            </div>
          </div>
        )}
        
        <iframe
          key={iframeKey}
          src={previewUrl}
          className="w-full h-[600px] bg-white rounded-lg"
          title={`${type} preview`}
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-downloads"
          onLoad={() => {
            setIsIframeLoading(false);
            console.log(`[SandboxPreview] Iframe loaded: ${previewUrl}`);
          }}
          onError={() => {
            setIsIframeLoading(false);
            console.error(`[SandboxPreview] Iframe failed to load: ${previewUrl}`);
          }}
        />
      </div>

      {/* Console Output (Toggle) */}
      {showConsole && output && (
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-400">Console Output</span>
          </div>
          <div className="font-mono text-xs whitespace-pre-wrap text-gray-300 max-h-48 overflow-y-auto">
            {output}
          </div>
        </div>
      )}
    </div>
  );
}