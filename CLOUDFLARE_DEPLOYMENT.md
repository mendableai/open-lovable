# 🚀 دليل النشر على Cloudflare Pages

هذا الدليل يوضح كيفية نشر تطبيق Open Lovable على منصة Cloudflare Pages.

## 📋 المتطلبات الأساسية

### 1. حساب Cloudflare
- إنشاء حساب مجاني على [Cloudflare](https://dash.cloudflare.com/sign-up)
- التأكد من تفعيل Cloudflare Pages

### 2. API Keys المطلوبة

#### 🤖 OpenAI API
```
1. اذهب إلى https://platform.openai.com
2. أنشئ حساب جديد أو سجل دخول
3. اذهب إلى API Keys
4. أنشئ مفتاح جديد
5. احتفظ بالمفتاح (يبدأ بـ sk-)
```

#### 🧠 Anthropic Claude API
```
1. اذهب إلى https://console.anthropic.com
2. أنشئ حساب جديد
3. اذهب إلى API Keys
4. أنشئ مفتاح جديد
5. احتفظ بالمفتاح (يبدأ بـ sk-ant-)
```

#### ☁️ E2B Sandbox API
```
1. اذهب إلى https://e2b.dev
2. أنشئ حساب جديد
3. اذهب إلى API Keys
4. أنشئ مفتاح جديد
5. احتفظ بالمفتاح (يبدأ بـ e2b-)
```

## 🛠️ إعداد المشروع للنشر

### الخطوة 1: إعداد الملفات

تم إنشاء الملفات التالية تلقائياً:
- ✅ `wrangler.toml` - إعدادات Cloudflare
- ✅ `next.config.ts` - إعداد Next.js للنشر الثابت
- ✅ `.nvmrc` - تحديد إصدار Node.js
- ✅ `functions/api/` - دوال Cloudflare لـ APIs

### الخطوة 2: تثبيت Wrangler CLI

```bash
# محلياً (مطلوب للاختبار المحلي)
npm install

# أو عالمياً (اختياري)
npm install -g wrangler
```

### الخطوة 3: تسجيل الدخول إلى Cloudflare

```bash
npx wrangler login
```

## 📤 طرق النشر

### الطريقة 1: النشر التلقائي عبر GitHub (مُوصى به)

#### أ) ربط المستودع

1. ادفع المشروع إلى GitHub
```bash
git add .
git commit -m "إعداد Cloudflare Pages"
git push origin main
```

2. اذهب إلى [Cloudflare Pages Dashboard](https://dash.cloudflare.com/pages)

3. اضغط على "Create a project"

4. اختر "Connect to Git" وحدد المستودع

5. إعدادات البناء:
```
Framework preset: Next.js
Build command: npm run build
Build output directory: out
Root directory: /
Environment variables: [سيتم إعدادها لاحقاً]
```

#### ب) إعداد متغيرات البيئة

في Cloudflare Pages Dashboard:
1. اذهب إلى مشروعك > Settings > Environment variables
2. أضف المتغيرات التالية:

```env
# Production Environment
OPENAI_API_KEY = sk-your-openai-key-here
ANTHROPIC_API_KEY = sk-ant-your-anthropic-key-here
E2B_API_KEY = e2b-your-e2b-key-here
NEXT_PUBLIC_APP_URL = https://your-site.pages.dev
NODE_ENV = production
NEXT_TELEMETRY_DISABLED = 1
```

3. احفظ الإعدادات وانتظر إعادة البناء

### الطريقة 2: النشر اليدوي

#### أ) بناء المشروع

```bash
# بناء الملفات للإنتاج
npm run build

# أو استخدم الأمر المخصص
npm run cf:build
```

#### ب) النشر

```bash
# النشر المباشر
npm run deploy

# أو للمعاينة
npm run deploy:preview
```

## 🔧 إعداد Cloudflare Functions

### هيكل المجلدات
```
functions/
├── api/
│   ├── ai-chat.ts          # دردشة AI
│   ├── sandbox.ts          # إدارة البيئة الافتراضية
│   └── scrape-url.ts       # استخراج المواقع
```

### ميزات Functions المدعومة
- ✅ **AI Chat** - دردشة مع OpenAI/Claude
- ✅ **Sandbox Management** - إدارة بيئة E2B
- ✅ **Web Scraping** - استخراج محتوى المواقع (مبسط)
- ⚠️ **Puppeteer** - غير مدعوم (استخدم scraping مبسط)

## 🚨 التحديات والحلول

### 1. Puppeteer غير متوافق
**المشكلة**: Cloudflare Workers لا يدعم Puppeteer
**الحل**: استخدام fetch API لاستخراج المحتوى الأساسي

### 2. File System محدود
**المشكلة**: لا توجد ملفات دائمة في Workers
**الحل**: استخدام E2B Sandbox للملفات أو Cloudflare R2 للتخزين

### 3. Memory و CPU محدود
**المشكلة**: Workers لها حدود على الموارد
**الحل**: تحسين الكود وتقليل العمليات المعقدة

## 🔍 اختبار النشر

### الاختبار المحلي

```bash
# اختبار Functions محلياً
npm run cf:dev

# أو
npx wrangler pages dev out
```

### اختبار الإنتاج

1. اذهب إلى رابط موقعك: `https://your-project.pages.dev`
2. اختبر الميزات:
   - ✅ إنشاء Sandbox
   - ✅ AI Chat
   - ✅ Web Scraping
   - ✅ Code Generation

## 📊 المراقبة والصيانة

### Cloudflare Analytics
- مراقبة الزيارات والأداء
- تتبع أخطاء Functions
- مراقبة استهلاك الموارد

### Logs
```bash
# عرض سجلات Functions
npx wrangler tail

# أو من لوحة التحكم
# Cloudflare Dashboard > Workers & Pages > [your-project] > Functions > Logs
```

## 🔐 الأمان

### API Keys
- لا تشارك API Keys أبداً
- استخدم Environment Variables فقط
- راجع الصلاحيات دورياً

### CORS
تم إعداد CORS في Functions:
```typescript
headers: {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}
```

## 🎯 نصائح للأداء

### 1. تحسين البناء
```bash
# استخدم build مُحسن
npm run cf:build
```

### 2. ضغط الأصول
- الصور: WebP format
- JavaScript: منفي تلقائياً
- CSS: منفي تلقائياً

### 3. استخدام CDN
Cloudflare CDN مُفعل تلقائياً لجميع الملفات الثابتة

## 🆘 حل المشاكل الشائعة

### خطأ: "Build failed"
```bash
# تحقق من الـ logs
npx wrangler pages deployment list
```

### خطأ: "Environment variables missing"
1. تأكد من إضافة جميع المتغيرات في Dashboard
2. تحقق من صحة API Keys
3. راجع أسماء المتغيرات

### خطأ: "Function timeout"
- قلل من العمليات المعقدة
- استخدم async/await بشكل صحيح
- اختبر محلياً أولاً

## 📚 مصادر إضافية

- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)
- [Cloudflare Functions](https://developers.cloudflare.com/pages/functions/)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [E2B Documentation](https://e2b.dev/docs)

---

## ✅ قائمة التحقق النهائية

قبل النشر تأكد من:
- [ ] جميع API Keys محدثة وصالحة
- [ ] متغيرات البيئة مُعدة في Cloudflare
- [ ] الكود يعمل محلياً
- [ ] تم اختبار جميع الميزات
- [ ] تم حفظ نسخة احتياطية من المشروع

🎉 **مبروك! تطبيق Open Lovable الآن يعمل على Cloudflare Pages!**