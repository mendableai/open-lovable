/**
 * Debug utilities for Open Lovable
 * Provides debugging helpers and performance monitoring
 */

import { log } from './logger';

export interface PerformanceTimer {
  start: number;
  context: string;
  metadata?: Record<string, any>;
}

class DebugUtils {
  private timers: Map<string, PerformanceTimer> = new Map();
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
  }

  /**
   * Start a performance timer
   */
  startTimer(name: string, context: string, metadata?: Record<string, any>): void {
    this.timers.set(name, {
      start: performance.now(),
      context,
      metadata
    });
    
    if (this.isDevelopment) {
      log.trace(`Timer started: ${name}`, context, metadata);
    }
  }

  /**
   * End a performance timer and log the duration
   */
  endTimer(name: string): number | null {
    const timer = this.timers.get(name);
    if (!timer) {
      log.warn(`Timer not found: ${name}`, 'debug');
      return null;
    }

    const duration = performance.now() - timer.start;
    this.timers.delete(name);

    log.performance(`${name} completed`, duration, timer.metadata);
    return duration;
  }

  /**
   * Measure the execution time of an async function
   */
  async measure<T>(
    name: string, 
    context: string, 
    fn: () => Promise<T>, 
    metadata?: Record<string, any>
  ): Promise<T> {
    this.startTimer(name, context, metadata);
    try {
      const result = await fn();
      this.endTimer(name);
      return result;
    } catch (error) {
      this.endTimer(name);
      log.error(`Error in ${name}`, context, { error, metadata });
      throw error;
    }
  }

  /**
   * Log function entry and exit (for debugging complex flows)
   */
  trace(functionName: string, context: string, args?: any[]): () => void {
    if (!this.isDevelopment) {
      return () => {}; // No-op in production
    }

    log.trace(`→ Entering ${functionName}`, context, { args });
    
    return () => {
      log.trace(`← Exiting ${functionName}`, context);
    };
  }

  /**
   * Debug object inspection with safe JSON serialization
   */
  inspect(obj: any, label: string, context: string): void {
    if (!this.isDevelopment) return;

    try {
      const inspected = this.safeStringify(obj);
      log.debug(`${label}:`, context, { data: inspected });
    } catch (error) {
      log.warn(`Failed to inspect object: ${label}`, context, { error });
    }
  }

  /**
   * Safe JSON stringify that handles circular references
   */
  private safeStringify(obj: any, maxDepth: number = 3): any {
    const seen = new WeakSet();
    
    const replacer = (key: string, value: any, depth = 0): any => {
      if (depth > maxDepth) return '[Max Depth Exceeded]';
      
      if (value === null) return null;
      
      if (typeof value === 'object') {
        if (seen.has(value)) return '[Circular Reference]';
        seen.add(value);
        
        if (Array.isArray(value)) {
          return value.map((item, index) => replacer(index.toString(), item, depth + 1));
        }
        
        const result: any = {};
        for (const [k, v] of Object.entries(value)) {
          result[k] = replacer(k, v, depth + 1);
        }
        return result;
      }
      
      if (typeof value === 'function') return '[Function]';
      if (typeof value === 'undefined') return '[Undefined]';
      if (typeof value === 'symbol') return '[Symbol]';
      
      return value;
    };
    
    return replacer('', obj);
  }

  /**
   * Create a debug session for tracking related operations
   */
  createSession(sessionId: string): DebugSession {
    return new DebugSession(sessionId, this);
  }

  /**
   * Log memory usage (Node.js only)
   */
  logMemoryUsage(context: string): void {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const usage = process.memoryUsage();
      const formatBytes = (bytes: number) => (bytes / 1024 / 1024).toFixed(2) + ' MB';
      
      log.debug('Memory usage', context, {
        rss: formatBytes(usage.rss),
        heapTotal: formatBytes(usage.heapTotal),
        heapUsed: formatBytes(usage.heapUsed),
        external: formatBytes(usage.external)
      });
    }
  }

  /**
   * Conditional debugging based on environment variables
   */
  debugIf(condition: string, message: string, context: string, metadata?: Record<string, any>): void {
    const envVar = process.env[`DEBUG_${condition.toUpperCase()}`];
    if (envVar === 'true' || envVar === '1') {
      log.debug(message, context, metadata);
    }
  }
}

/**
 * Debug session for tracking related operations
 */
class DebugSession {
  private sessionId: string;
  private debug: DebugUtils;
  private startTime: number;

  constructor(sessionId: string, debug: DebugUtils) {
    this.sessionId = sessionId;
    this.debug = debug;
    this.startTime = performance.now();
    
    log.debug(`Session started: ${sessionId}`, 'debug-session');
  }

  timer(name: string, context: string, metadata?: Record<string, any>): void {
    this.debug.startTimer(`${this.sessionId}:${name}`, context, {
      sessionId: this.sessionId,
      ...metadata
    });
  }

  endTimer(name: string): number | null {
    return this.debug.endTimer(`${this.sessionId}:${name}`);
  }

  log(message: string, context: string, metadata?: Record<string, any>): void {
    log.debug(message, context, {
      sessionId: this.sessionId,
      sessionDuration: performance.now() - this.startTime,
      ...metadata
    });
  }

  end(): void {
    const duration = performance.now() - this.startTime;
    log.debug(`Session ended: ${this.sessionId}`, 'debug-session', { 
      totalDuration: duration 
    });
  }
}

// Export singleton instance
export const debug = new DebugUtils();

// Convenience exports
export const measure = debug.measure.bind(debug);
export const trace = debug.trace.bind(debug);
export const inspect = debug.inspect.bind(debug);
export const startTimer = debug.startTimer.bind(debug);
export const endTimer = debug.endTimer.bind(debug);
export const createSession = debug.createSession.bind(debug);
export const logMemoryUsage = debug.logMemoryUsage.bind(debug);
export const debugIf = debug.debugIf.bind(debug);

export default debug;