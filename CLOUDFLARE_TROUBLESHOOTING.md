# 🔧 دليل حل مشاكل Cloudflare Pages

هذا الدليل يساعدك في حل المشاكل الشائعة عند نشر Open Lovable على Cloudflare Pages.

## 🚨 مشاكل البناء (Build Issues)

### خطأ: "Build command failed"

```
❌ Error: Build command "npm run build" failed with exit code 1
```

**الأسباب المحتملة:**
1. أخطاء في الكود TypeScript
2. مكتبات مفقودة
3. متغيرات البيئة غائبة

**الحلول:**
```bash
# اختبار محلي أولاً
npm run build

# إصلاح أخطاء TypeScript
npx tsc --noEmit

# تحقق من dependencies
npm install
```

### خطأ: "Module not found"

```
❌ Error: Module '"puppeteer"' not found
```

**السبب:** Puppeteer لا يعمل في Cloudflare Workers

**الحل:** تم استبداله بـ fetch API في `functions/api/scrape-url.ts`

### خطأ: "Out of memory"

```
❌ Error: JavaScript heap out of memory
```

**الحل:**
```json
// في package.json
"scripts": {
  "build": "NODE_OPTIONS='--max-old-space-size=4096' next build"
}
```

## 🌐 مشاكل Functions

### خطأ: "Function timeout"

```
❌ Error: Function exceeded time limit of 30s
```

**الأسباب:**
- عمليات طويلة في API
- انتظار استجابة بطيئة من خدمات خارجية

**الحلول:**
```typescript
// في functions/api/
export async function onRequestPost(context) {
  // إضافة timeout للطلبات الخارجية
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25000); // 25s

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      // ... other options
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    if (error.name === 'AbortError') {
      return new Response('Request timeout', { status: 408 });
    }
    throw error;
  }
}
```

### خطأ: "Environment variable not found"

```
❌ Error: OPENAI_API_KEY is not defined
```

**الحل:**
1. تحقق من Cloudflare Pages Dashboard
2. Settings > Environment variables
3. أضف المتغيرات المطلوبة
4. أعد النشر

### خطأ: "CORS policy"

```
❌ Error: Blocked by CORS policy
```

**الحل:** تحقق من headers في Functions:
```typescript
export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
```

## 📡 مشاكل API Integration

### مشكلة: E2B Sandbox لا يعمل

**الأعراض:**
- Sandbox لا ينشأ
- خطأ في الاتصال بـ E2B

**الحلول:**
```typescript
// تحقق من API key
if (!env.E2B_API_KEY) {
  return new Response(
    JSON.stringify({ error: 'E2B API key not configured' }),
    { status: 500 }
  );
}

// إضافة retry logic
async function createSandboxWithRetry(apiKey: string, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await Sandbox.create({ apiKey });
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}
```

### مشكلة: OpenAI API Rate Limiting

```
❌ Error: Rate limit exceeded
```

**الحل:**
```typescript
// إضافة exponential backoff
async function callOpenAIWithBackoff(prompt: string, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
      });
    } catch (error) {
      if (error.status === 429 && i < retries - 1) {
        const delay = Math.pow(2, i) * 1000; // 1s, 2s, 4s
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
}
```

## 🔍 مشاكل النشر

### خطأ: "Deployment failed"

```
❌ Error: Deployment failed after 3 attempts
```

**الأسباب:**
1. مشاكل في الشبكة
2. حجم الملفات كبير جداً
3. مشاكل في Cloudflare

**الحلول:**
```bash
# تنظيف cache
rm -rf .next out node_modules
npm install
npm run build

# تقليل حجم الملفات
# إزالة الملفات غير الضرورية من .gitignore
```

### مشكلة: "Custom domain not working"

**الأعراض:**
- الموقع يعمل على *.pages.dev لكن ليس على الدومين المخصص

**الحلول:**
1. تحقق من DNS records في Cloudflare
2. تأكد من أن الدومين مُضاف في Pages settings
3. انتظر انتشار DNS (قد يستغرق 24 ساعة)

## 🎯 تحسين الأداء

### بطء تحميل الصفحات

**الحلول:**
```typescript
// تحسين الصور
// في next.config.ts
images: {
  unoptimized: true,
  formats: ['image/webp'],
}

// تقليل حجم JavaScript
webpack: (config) => {
  config.optimization.splitChunks = {
    chunks: 'all',
    cacheGroups: {
      vendor: {
        test: /[\\/]node_modules[\\/]/,
        chunks: 'all',
      },
    },
  };
  return config;
}
```

### بطء استجابة Functions

```typescript
// Caching للطلبات المتكررة
const cache = new Map();

export async function onRequestPost(context) {
  const cacheKey = JSON.stringify(requestBody);
  
  if (cache.has(cacheKey)) {
    return new Response(
      JSON.stringify(cache.get(cacheKey)),
      { headers: { 'Content-Type': 'application/json' } }
    );
  }
  
  const result = await processRequest(requestBody);
  cache.set(cacheKey, result);
  
  return new Response(JSON.stringify(result));
}
```

## 🔐 مشاكل الأمان

### خطأ: "API key exposed"

**المشكلة:** API keys ظاهرة في الكود أو logs

**الحلول:**
1. نقل جميع الـ keys إلى Environment Variables
2. تحقق من أن API calls تتم في Functions فقط
3. لا تستخدم API keys في client-side code

### مشكلة: "Unauthorized access"

**الحل:** إضافة authentication:
```typescript
export async function onRequestPost(context) {
  const authHeader = context.request.headers.get('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401 }
    );
  }
  
  // التحقق من الـ token
  const token = authHeader.slice(7);
  if (!isValidToken(token)) {
    return new Response(
      JSON.stringify({ error: 'Invalid token' }),
      { status: 403 }
    );
  }
  
  // متابعة المعالجة...
}
```

## 📊 مراقبة وTroubleshooting

### تفعيل Logging

```typescript
// في Functions
console.log('Request received:', {
  url: context.request.url,
  method: context.request.method,
  timestamp: new Date().toISOString()
});

// استخدام structured logging
const log = {
  level: 'info',
  message: 'Function executed successfully',
  duration: Date.now() - startTime,
  userId: 'user123'
};
console.log(JSON.stringify(log));
```

### مراقبة الأخطاء

```typescript
// Error tracking
export async function onRequestPost(context) {
  try {
    return await handleRequest(context);
  } catch (error) {
    // Log detailed error info
    console.error('Function error:', {
      error: error.message,
      stack: error.stack,
      url: context.request.url,
      timestamp: new Date().toISOString()
    });
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        requestId: generateRequestId() 
      }),
      { status: 500 }
    );
  }
}
```

## 🆘 الحصول على المساعدة

### Cloudflare Community
- [Cloudflare Community Forum](https://community.cloudflare.com/)
- [Discord Server](https://discord.gg/cloudflaredev)

### الوثائق الرسمية
- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)
- [Functions Documentation](https://developers.cloudflare.com/pages/functions/)

### GitHub Issues
إذا واجهت مشكلة محددة في المشروع:
1. ابحث في [Issues](../../issues) الموجودة
2. أنشئ issue جديد مع:
   - وصف المشكلة
   - خطوات إعادة الإنتاج
   - رسائل الخطأ
   - معلومات البيئة

---

## ✅ Troubleshooting Checklist

عند مواجهة أي مشكلة:

- [ ] اختبر الكود محلياً أولاً
- [ ] تحقق من logs في Cloudflare Dashboard
- [ ] راجع Environment Variables
- [ ] تأكد من صحة API Keys
- [ ] اختبر الـ Functions منفصلة
- [ ] راجع CORS settings
- [ ] تحقق من حدود الموارد
- [ ] اقرأ error messages بعناية

🛠️ **مع هذا الدليل يمكنك حل معظم المشاكل التي قد تواجهك!**