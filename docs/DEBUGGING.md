# Debugging Guide for Open Lovable

This guide explains the debugging and logging system implemented in Open Lovable.

## Logging System

Open Lovable uses a structured logging system that provides consistent, configurable logging across the entire application.

### Log Levels

- `ERROR` (0): Critical errors that need immediate attention
- `WARN` (1): Warnings about potential issues
- `INFO` (2): General information about application flow
- `DEBUG` (3): Detailed debugging information
- `TRACE` (4): Very detailed tracing (development only)

### Configuration

Set the log level using the `LOG_LEVEL` environment variable:

```bash
# Development
LOG_LEVEL=DEBUG

# Production  
LOG_LEVEL=INFO

# Troubleshooting
LOG_LEVEL=TRACE
```

### Usage

```typescript
import { log } from '@/lib/logger';

// Basic logging
log.info('User logged in', 'auth');
log.error('Database connection failed', 'db', { error });
log.debug('Processing request', 'api', { userId: 123 });

// Specialized loggers
log.api('POST', '/api/users', { userId: 123 });
log.package('Installing', 'react-router-dom');
log.file('Writing', '/src/components/Button.tsx');
log.sandbox('Starting', 'sandbox-123', { memory: '512MB' });
```

### Structured Output

All logs are structured with:
- Timestamp
- Log level
- Context (component/module)
- Message
- Metadata (optional)

Example output:
```
2024-12-19T10:30:45.123Z DEBUG [api] Processing request {"userId":123,"endpoint":"/users"}
2024-12-19T10:30:45.456Z ERROR [db] Connection failed {"error":"ECONNREFUSED","retries":3}
```

## Debug Utilities

The debug system provides additional utilities for performance monitoring and debugging complex flows.

### Performance Measurement

```typescript
import { debug, measure } from '@/lib/debug';

// Manual timers
debug.startTimer('file-processing', 'api');
// ... do work
const duration = debug.endTimer('file-processing');

// Automatic measurement
const result = await measure('database-query', 'db', async () => {
  return await db.query('SELECT * FROM users');
}, { query: 'users' });
```

### Function Tracing

```typescript
import { trace } from '@/lib/debug';

function complexFunction(arg1: string, arg2: number) {
  const exit = trace('complexFunction', 'service', [arg1, arg2]);
  
  // ... function logic
  
  exit(); // Log function exit
}
```

### Debug Sessions

For tracking related operations across multiple functions:

```typescript
import { createSession } from '@/lib/debug';

const session = createSession('user-signup');

session.timer('validation', 'auth');
// ... validate user
session.endTimer('validation');

session.timer('save-user', 'db');
// ... save user
session.endTimer('save-user');

session.end(); // End session with total duration
```

### Object Inspection

Safely inspect complex objects with circular reference handling:

```typescript
import { inspect } from '@/lib/debug';

inspect(complexObject, 'User Data', 'auth');
```

## Environment-Specific Debugging

### Development Mode

In development, all debug features are enabled:
- Detailed logging
- Function tracing
- Performance monitoring
- Memory usage logging

### Production Mode

In production:
- Only ERROR, WARN, and INFO logs
- Performance monitoring for critical paths only
- No function tracing
- Optimized for minimal overhead

### Conditional Debugging

Enable specific debugging features via environment variables:

```bash
DEBUG_SANDBOX=true    # Enable sandbox debugging
DEBUG_PACKAGES=true   # Enable package installation debugging
DEBUG_AI=true         # Enable AI model debugging
```

Usage:
```typescript
import { debugIf } from '@/lib/debug';

debugIf('SANDBOX', 'Sandbox operation completed', 'sandbox', { 
  sandboxId, duration 
});
```

## API Debugging

Each API route has structured logging:

```typescript
// At the start of API routes
log.api('POST', request.url, { 
  userAgent: request.headers.get('user-agent'),
  contentLength: request.headers.get('content-length')
});

// For responses
log.apiResponse(request.url, 200, duration, { 
  filesProcessed: 3 
});

// For errors
log.apiError(request.url, error, { 
  userId, requestId 
});
```

## Debugging Common Issues

### Sandbox Connection Issues

Enable sandbox debugging:
```bash
DEBUG_SANDBOX=true
```

Look for logs with context `sandbox`:
```
DEBUG [sandbox-123] Connection established {"host":"...", "timeout":30000}
WARN  [sandbox-123] Reconnection attempt 2 failed {"error":"timeout"}
ERROR [sandbox-123] Failed to reconnect {"error":"...", "attempts":3}
```

### Package Installation Problems

Enable package debugging:
```bash
DEBUG_PACKAGES=true  
```

Look for logs with context `PKG`:
```
DEBUG [PKG] Detected from imports: react-router-dom
DEBUG [PKG] Installing packages {"packages":["react-router-dom","lucide-react"]}
ERROR [PKG] Installation failed {"package":"react-router-dom","error":"..."}
```

### AI Model Issues

Enable AI debugging:
```bash
DEBUG_AI=true
```

Look for logs with context matching model names:
```
DEBUG [openai] Generating code {"model":"gpt-4","tokens":1500}
DEBUG [anthropic] Analysis complete {"model":"claude-3","duration":"2.3s"}
```

## Performance Monitoring

### Memory Usage

Monitor memory usage in development:
```typescript
import { logMemoryUsage } from '@/lib/debug';

logMemoryUsage('after-file-processing');
```

### Request Timing

All API requests are automatically timed:
```
INFO  [api] POST /api/apply-ai-code {"duration":"3.2s","files":5}
```

### Slow Operation Detection

Operations taking longer than expected are automatically flagged:
```
WARN  [api] Slow operation detected {"operation":"file-write","duration":"5.2s","threshold":"2s"}
```

## Log Analysis

### Filtering Logs

In development, filter logs by context:
```bash
# Show only sandbox-related logs
grep '\[sandbox' logs.txt

# Show only errors
grep 'ERROR' logs.txt

# Show API performance
grep 'duration' logs.txt
```

### Common Log Patterns

```bash
# Failed operations
grep -E 'ERROR|WARN' logs.txt

# Performance issues
grep 'duration.*[5-9]\.[0-9]s' logs.txt

# Package problems
grep '\[PKG\].*ERROR' logs.txt
```

## Best Practices

1. **Use appropriate log levels**: Don't use DEBUG for production-critical information
2. **Include context**: Always provide meaningful context strings
3. **Add metadata**: Include relevant data in the metadata object
4. **Performance-aware**: Use TRACE level for very verbose debugging only
5. **Structured logging**: Prefer structured metadata over string concatenation
6. **Error context**: Always include error objects in error logs

## Troubleshooting

### No Logs Appearing

1. Check `LOG_LEVEL` environment variable
2. Ensure logger is imported correctly
3. Check console output in development
4. Verify deployment environment variables

### Too Many Logs

1. Increase `LOG_LEVEL` from DEBUG to INFO
2. Disable specific debug flags
3. Use conditional debugging with `debugIf()`

### Missing Context

1. Add meaningful context strings to all log calls
2. Include relevant metadata
3. Use specialized loggers (`log.api`, `log.package`, etc.)

This logging system provides comprehensive debugging capabilities while maintaining performance in production environments.