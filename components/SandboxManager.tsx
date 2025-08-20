'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Play, 
  Square, 
  RefreshCw, 
  ExternalLink, 
  Terminal, 
  FileText,
  Download,
  Trash2,
  CheckCircle,
  AlertCircle,
  Clock
} from 'lucide-react';

interface SandboxStatus {
  id?: string;
  status: 'idle' | 'creating' | 'running' | 'error' | 'stopped';
  url?: string;
  files?: any[];
  createdAt?: Date;
  lastActivity?: Date;
}

interface SandboxManagerProps {
  onSandboxCreate?: (prompt: string) => Promise<void>;
  onSandboxStop?: () => Promise<void>;
  onSandboxRestart?: () => Promise<void>;
  onFilesDownload?: () => Promise<void>;
  className?: string;
}

export default function SandboxManager({
  onSandboxCreate,
  onSandboxStop,
  onSandboxRestart,
  onFilesDownload,
  className = ''
}: SandboxManagerProps) {
  const [sandboxStatus, setSandboxStatus] = useState<SandboxStatus>({ status: 'idle' });
  const [isLoading, setIsLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const getStatusColor = (status: SandboxStatus['status']) => {
    switch (status) {
      case 'running': return 'bg-green-500';
      case 'creating': return 'bg-yellow-500';
      case 'error': return 'bg-red-500';
      case 'stopped': return 'bg-gray-500';
      default: return 'bg-gray-400';
    }
  };

  const getStatusText = (status: SandboxStatus['status']) => {
    switch (status) {
      case 'running': return 'Running';
      case 'creating': return 'Creating...';
      case 'error': return 'Error';
      case 'stopped': return 'Stopped';
      default: return 'Idle';
    }
  };

  const getStatusIcon = (status: SandboxStatus['status']) => {
    switch (status) {
      case 'running': return <Play className="w-4 h-4 text-green-600" />;
      case 'creating': return <RefreshCw className="w-4 h-4 text-yellow-600 animate-spin" />;
      case 'error': return <AlertCircle className="w-4 h-4 text-red-600" />;
      case 'stopped': return <Square className="w-4 h-4 text-gray-600" />;
      default: return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const handleCreateSandbox = async () => {
    if (!onSandboxCreate) return;
    
    setIsLoading(true);
    try {
      await onSandboxCreate('Create a new sandbox environment');
    } catch (error) {
      console.error('Failed to create sandbox:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStopSandbox = async () => {
    if (!onSandboxStop) return;
    
    setIsLoading(true);
    try {
      await onSandboxStop();
      setSandboxStatus(prev => ({ ...prev, status: 'stopped' }));
    } catch (error) {
      console.error('Failed to stop sandbox:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestartSandbox = async () => {
    if (!onSandboxRestart) return;
    
    setIsLoading(true);
    try {
      await onSandboxRestart();
      setSandboxStatus(prev => ({ ...prev, status: 'creating' }));
    } catch (error) {
      console.error('Failed to restart sandbox:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadFiles = async () => {
    if (!onFilesDownload) return;
    
    try {
      await onFilesDownload();
    } catch (error) {
      console.error('Failed to download files:', error);
    }
  };

  const formatTime = (date?: Date) => {
    if (!date) return 'N/A';
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getUptime = () => {
    if (!sandboxStatus.createdAt) return 'N/A';
    const now = new Date();
    const diff = now.getTime() - sandboxStatus.createdAt.getTime();
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  return (
    <div className={`bg-white/80 backdrop-blur-sm rounded-2xl border border-white/20 p-6 space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Terminal className="w-5 h-5 mr-2 text-blue-600" />
          Sandbox Manager
        </h3>
        
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${getStatusColor(sandboxStatus.status)}`} />
          <span className="text-sm text-gray-600 capitalize">
            {getStatusText(sandboxStatus.status)}
          </span>
        </div>
      </div>

      {/* Status Card */}
      <div className="bg-gray-50/50 rounded-xl p-4 space-y-4">
        <div className="flex items-center space-x-3">
          {getStatusIcon(sandboxStatus.status)}
          <div>
            <h4 className="font-medium text-gray-900">Current Status</h4>
            <p className="text-sm text-gray-600">
              {sandboxStatus.status === 'running' && 'Your sandbox is active and ready for development'}
              {sandboxStatus.status === 'creating' && 'Setting up your development environment...'}
              {sandboxStatus.status === 'error' && 'An error occurred while setting up the sandbox'}
              {sandboxStatus.status === 'stopped' && 'Sandbox has been stopped'}
              {sandboxStatus.status === 'idle' && 'No active sandbox'}
            </p>
          </div>
        </div>

        {sandboxStatus.url && (
          <div className="bg-white rounded-lg p-3 border border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Preview URL</span>
              <Button size="sm" variant="outline" asChild>
                <a href={sandboxStatus.url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open
                </a>
              </Button>
            </div>
            <div className="mt-2 text-xs font-mono text-gray-600 bg-gray-100 p-2 rounded">
              {sandboxStatus.url}
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {getUptime()}
            </div>
            <div className="text-xs text-gray-500">Uptime</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {sandboxStatus.files?.length || 0}
            </div>
            <div className="text-xs text-gray-500">Files</div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-3">
        <h4 className="font-medium text-gray-900">Actions</h4>
        
        <div className="grid grid-cols-2 gap-3">
          {sandboxStatus.status === 'idle' && (
            <Button
              onClick={handleCreateSandbox}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Play className="w-4 h-4 mr-2" />
              )}
              Create Sandbox
            </Button>
          )}

          {sandboxStatus.status === 'running' && (
            <>
              <Button
                onClick={handleStopSandbox}
                disabled={isLoading}
                variant="outline"
                className="w-full"
              >
                <Square className="w-4 h-4 mr-2" />
                Stop
              </Button>
              
              <Button
                onClick={handleRestartSandbox}
                disabled={isLoading}
                variant="outline"
                className="w-full"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Restart
              </Button>
            </>
          )}

          {sandboxStatus.status === 'stopped' && (
            <Button
              onClick={handleRestartSandbox}
              disabled={isLoading}
              className="w-full"
            >
              <Play className="w-4 h-4 mr-2" />
              Restart
            </Button>
          )}

          {sandboxStatus.status === 'error' && (
            <Button
              onClick={handleCreateSandbox}
              disabled={isLoading}
              className="w-full"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          )}
        </div>

        {sandboxStatus.status === 'running' && (
          <Button
            onClick={handleDownloadFiles}
            variant="outline"
            className="w-full"
          >
            <Download className="w-4 h-4 mr-2" />
            Download Files
          </Button>
        )}
      </div>

      {/* Recent Activity */}
      {logs.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900">Recent Activity</h4>
          <div className="bg-gray-50/50 rounded-lg p-3 max-h-32 overflow-y-auto">
            {logs.map((log, index) => (
              <div key={index} className="text-xs text-gray-600 mb-1">
                {log}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info */}
      <div className="text-xs text-gray-500 space-y-1">
        <p>• Sandboxes automatically stop after 10 minutes of inactivity</p>
        <p>• All files are preserved until the sandbox is stopped</p>
        <p>• You can download your files at any time</p>
      </div>
    </div>
  );
}