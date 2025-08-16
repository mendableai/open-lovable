'use client';

import { useState, useEffect } from 'react';

interface ErrorEntry {
  message: string;
  stack?: string;
  timestamp: string;
}

export default function DiagnosticsPanel() {
  // Only show in development
  if (process.env.NODE_ENV !== 'development') return null;

  const [errors, setErrors] = useState<ErrorEntry[]>([]);

  useEffect(() => {
    function handleError(event: ErrorEvent) {
      setErrors((prev) => [
        ...prev,
        { message: event.message, stack: event.error?.stack, timestamp: new Date().toISOString() },
      ]);
    }

    function handleRejection(event: PromiseRejectionEvent) {
      setErrors((prev) => [
        ...prev,
        { message: event.reason?.message || String(event.reason), stack: event.reason?.stack, timestamp: new Date().toISOString() },
      ]);
    }

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, []);

  return (
    <div style={{ position: 'fixed', bottom: 0, right: 0, width: 300, maxHeight: 200, overflowY: 'auto', background: '#fff', border: '1px solid #ccc', padding: 10, zIndex: 9999 }}>
      <h4>Diagnostics Panel</h4>
      {errors.map((err, idx) => (
        <div key={idx} style={{ marginBottom: 10 }}>
          <strong>{err.timestamp}</strong>
          <div>{err.message}</div>
          {err.stack && <pre style={{ whiteSpace: 'pre-wrap' }}>{err.stack}</pre>}
        </div>
      ))}
    </div>
  );
}
