import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking } from 'react-native';
import { WebView } from 'react-native-webview';

interface SandboxPreviewProps {
  sandboxId: string;
  port: number;
  type: 'vite' | 'nextjs' | 'console';
  output?: string;
  isLoading?: boolean;
}

export default function SandboxPreview({ 
  sandboxId, 
  port, 
  type, 
  output,
  isLoading = false 
}: SandboxPreviewProps) {
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [showConsole, setShowConsole] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);

  useEffect(() => {
    if (sandboxId && type !== 'console') {
      // In production, this would be the actual E2B sandbox URL
      // Format: https://{sandboxId}-{port}.e2b.dev
      setPreviewUrl(`https://${sandboxId}-${port}.e2b.dev`);
    }
  }, [sandboxId, port, type]);

  const handleRefresh = () => {
    setIframeKey(prev => prev + 1);
  };

  const handleOpenInBrowser = () => {
    if (previewUrl) {
      Linking.openURL(previewUrl);
    }
  };

  if (type === 'console') {
    return (
      <View style={styles.consoleContainer}>
        <Text style={styles.consoleText}>
          {output || 'No output yet...'}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Preview Controls */}
      <View style={styles.controlsContainer}>
        <View style={styles.controlsLeft}>
          <Text style={styles.previewType}>
            {type === 'vite' ? '⚡ Vite' : '▲ Next.js'} Preview
          </Text>
          <View style={styles.urlContainer}>
            <Text style={styles.urlText}>
              {previewUrl}
            </Text>
          </View>
        </View>
        <View style={styles.controlsRight}>
          <TouchableOpacity
            onPress={() => setShowConsole(!showConsole)}
            style={styles.controlButton}
          >
            <Text style={styles.buttonText}>📟</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleRefresh}
            style={styles.controlButton}
          >
            <Text style={styles.buttonText}>🔄</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleOpenInBrowser}
            style={styles.controlButton}
          >
            <Text style={styles.buttonText}>🔗</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Preview */}
      <View style={styles.previewContainer}>
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <View style={styles.loadingContent}>
              <Text style={styles.loadingSpinner}>⏳</Text>
              <Text style={styles.loadingText}>
                {type === 'vite' ? 'Starting Vite dev server...' : 'Starting Next.js dev server...'}
              </Text>
            </View>
          </View>
        )}
        
        {previewUrl && (
          <WebView
            key={iframeKey}
            source={{ uri: previewUrl }}
            style={styles.webview}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={true}
          />
        )}
      </View>

      {/* Console Output (Toggle) */}
      {showConsole && output && (
        <View style={styles.consoleOutputContainer}>
          <View style={styles.consoleHeader}>
            <Text style={styles.consoleTitle}>Console Output</Text>
          </View>
          <ScrollView style={styles.consoleScroll}>
            <Text style={styles.consoleOutputText}>
              {output}
            </Text>
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  controlsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1f2937',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#374151',
  },
  controlsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  previewType: {
    fontSize: 14,
    color: '#9ca3af',
  },
  urlContainer: {
    backgroundColor: '#111827',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  urlText: {
    fontSize: 12,
    color: '#60a5fa',
  },
  controlsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  controlButton: {
    padding: 8,
    borderRadius: 4,
  },
  buttonText: {
    fontSize: 16,
  },
  previewContainer: {
    position: 'relative',
    backgroundColor: '#111827',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#374151',
    height: 600,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(17, 24, 39, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  loadingContent: {
    alignItems: 'center',
  },
  loadingSpinner: {
    fontSize: 32,
    marginBottom: 8,
  },
  loadingText: {
    fontSize: 14,
    color: '#9ca3af',
  },
  webview: {
    flex: 1,
    backgroundColor: 'white',
  },
  consoleOutputContainer: {
    backgroundColor: '#1f2937',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#374151',
  },
  consoleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  consoleTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9ca3af',
  },
  consoleScroll: {
    maxHeight: 192,
  },
  consoleOutputText: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#d1d5db',
  },
  consoleContainer: {
    backgroundColor: '#1f2937',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#374151',
  },
  consoleText: {
    fontFamily: 'monospace',
    fontSize: 14,
    color: '#d1d5db',
  },
});