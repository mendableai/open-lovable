# ⚡ دليل البدء السريع - Cloudflare Pages

**🎯 الهدف**: نشر المشروع على Cloudflare Pages في أقل من 15 دقيقة

## 🚀 الخطوات (3 خطوات فقط)

### الخطوة 1: رفع المشروع على GitHub
```bash
# إذا لم يكن مرفوع بعد
git add .
git commit -m "تجهيز للنشر على Cloudflare Pages"
git push origin main
```

### الخطوة 2: إنشاء مشروع Cloudflare Pages

1. **اذهب إلى**: [dash.cloudflare.com/pages](https://dash.cloudflare.com/pages)

2. **اضغط**: "Create a project" → "Connect to Git"

3. **اختر المستودع**: `you112ef/open-lovable`

4. **إعدادات البناء**:
   ```
   Framework preset: Next.js (Static HTML Export)
   Build command: npm run build
   Build output directory: out
   Root directory: / (leave empty)
   ```

5. **اضغط**: "Save and Deploy"

### الخطوة 3: إضافة API Keys

1. **في نفس الصفحة** → "Settings" → "Environment variables"

2. **أضف هذه المتغيرات**:
   ```
   OPENAI_API_KEY = sk-your-openai-key-here
   ANTHROPIC_API_KEY = sk-ant-your-anthropic-key-here  
   E2B_API_KEY = e2b-your-e2b-key-here
   ```

3. **احفظ** وانتظر إعادة البناء (2-3 دقائق)

## ✅ اكتمل!

رابط موقعك: `https://[project-name].pages.dev`

---

## 🔑 الحصول على API Keys (إضافي)

إذا لم تحصل على API keys بعد:

### OpenAI (مطلوب للذكاء الاصطناعي)
1. [platform.openai.com](https://platform.openai.com) → Sign up
2. Billing → Add payment method ($5 minimum)
3. API keys → Create new key
4. انسخ المفتاح (يبدأ بـ `sk-`)

### E2B (مطلوب لتشغيل الكود)
1. [e2b.dev](https://e2b.dev) → Sign up (مجاني)
2. API Keys → Create key  
3. انسخ المفتاح (يبدأ بـ `e2b-`)

### Anthropic (اختياري)
1. [console.anthropic.com](https://console.anthropic.com) → Sign up
2. API Keys → Create key
3. انسخ المفتاح (يبدأ بـ `sk-ant-`)

---

## 🧪 اختبار المشروع

1. **اذهب لموقعك**: `https://[project-name].pages.dev`

2. **اختبر الميزات**:
   - ✅ إنشاء Sandbox
   - ✅ AI Chat  
   - ✅ Web Scraping
   - ✅ Code Generation

3. **إذا لم يعمل شيء**:
   - تحقق من API Keys في Environment Variables
   - انتظر 2-3 دقائق لانتشار التحديث
   - راجع [CLOUDFLARE_TROUBLESHOOTING.md](./CLOUDFLARE_TROUBLESHOOTING.md)

---

## 🎉 تهاني!

موقعك الآن:
- 🚀 **سريع**: Cloudflare CDN عالمي
- 💰 **رخيص**: $0/شهر للاستخدام العادي  
- 🔒 **آمن**: DDoS protection مجاني
- 🌍 **عالمي**: يعمل من كل مكان

**استمتع ببناء التطبيقات بالذكاء الاصطناعي! 🤖✨**