# 🚀 GitHub Actions Workflows

تم إعداد مجموعة شاملة من GitHub Actions workflows لبناء واختبار ونشر مشروع Open-Lovable.

## 📋 Workflows المتاحة

### 1️⃣ **Build Android APK** (`.github/workflows/android.yml`)

**الغرض:** بناء تطبيق Android Native كـ APK

**المشغلات:**
- Push tags: `v*` (مثل v1.0.0, v1.1.0)
- Manual trigger (workflow_dispatch)

**الخطوات:**
1. ✅ Checkout repository
2. ✅ Setup Node.js 18
3. ✅ Install dependencies
4. ✅ Setup Java 17
5. ✅ Setup Android SDK
6. ✅ Cache Gradle packages
7. ✅ Generate Keystore
8. ✅ Build Release APK
9. ✅ Upload APK to GitHub Release

**المتطلبات:**
```env
KEYSTORE_PASSWORD=your_keystore_password
KEY_PASSWORD=your_key_password
```

### 2️⃣ **Build Web Application** (`.github/workflows/web-build.yml`)

**الغرض:** بناء تطبيق الويب

**المشغلات:**
- Push to main branch
- Pull requests to main
- Manual trigger

**الخطوات:**
1. ✅ Checkout repository
2. ✅ Setup Node.js 18
3. ✅ Install dependencies
4. ✅ Run linting
5. ✅ Build application
6. ✅ Upload build artifacts
7. ✅ Comment on PR

**المتطلبات:**
```env
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key
E2B_API_KEY=your_e2b_key
```

### 3️⃣ **Run Tests** (`.github/workflows/test.yml`)

**الغرض:** تشغيل جميع الاختبارات

**المشغلات:**
- Push to main branch
- Pull requests to main
- Manual trigger

**الخطوات:**
1. ✅ Checkout repository
2. ✅ Setup Node.js 18
3. ✅ Install dependencies
4. ✅ Run API tests
5. ✅ Run integration tests
6. ✅ Run code execution tests
7. ✅ Run all tests
8. ✅ Upload test results

### 4️⃣ **Security Check** (`.github/workflows/security.yml`)

**الغرض:** فحص الأمان

**المشغلات:**
- Push to main branch
- Pull requests to main
- Weekly schedule (Sundays)

**الخطوات:**
1. ✅ Checkout repository
2. ✅ Setup Node.js 18
3. ✅ Install dependencies
4. ✅ Run npm audit
5. ✅ Run Snyk security scan
6. ✅ Check for secrets in code
7. ✅ Upload security report

**المتطلبات:**
```env
SNYK_TOKEN=your_snyk_token
```

### 5️⃣ **Generate Documentation** (`.github/workflows/docs.yml`)

**الغرض:** توليد التوثيق تلقائياً

**المشغلات:**
- Push to main branch
- Manual trigger

**الخطوات:**
1. ✅ Checkout repository
2. ✅ Setup Node.js 18
3. ✅ Install dependencies
4. ✅ Generate API documentation
5. ✅ Update README with latest features
6. ✅ Commit and push documentation

## 🔧 كيفية الاستخدام

### 1️⃣ **بناء Android APK:**

#### الطريقة الأولى: عبر Tags
```bash
git tag v1.2.0
git push origin v1.2.0
```

#### الطريقة الثانية: يدوياً
1. اذهب إلى GitHub Repository
2. اختر "Actions"
3. اختر "Build Android APK"
4. اضغط "Run workflow"

### 2️⃣ **بناء تطبيق الويب:**
```bash
git push origin main
```

### 3️⃣ **تشغيل الاختبارات:**
```bash
git push origin main
```

### 4️⃣ **فحص الأمان:**
```bash
git push origin main
```

## 📊 مراقبة Workflows

### 1️⃣ **في GitHub:**
- اذهب إلى Repository → Actions
- ستجد جميع Workflows المدرجة
- اضغط على أي workflow لرؤية التفاصيل

### 2️⃣ **حالة Workflows:**
- 🟢 **Success** - تم بنجاح
- 🔴 **Failed** - فشل
- 🟡 **Running** - قيد التشغيل
- ⚪ **Skipped** - تم تخطيه

## 📱 النتائج

### **Android APK:**
- سيتم رفع APK إلى GitHub Releases
- يمكن تحميله مباشرة
- جاهز للتثبيت على Android

### **Web Build:**
- Build artifacts محفوظة
- يمكن استخدامها للنشر
- تعليقات على Pull Requests

### **Test Results:**
- تقارير الاختبارات محفوظة
- يمكن تحليلها لتحسين الكود
- تغطية الاختبارات

### **Security Reports:**
- تقارير الأمان محفوظة
- تنبيهات للمشاكل الأمنية
- فحص دوري للكود

## 🔑 إعداد Secrets

### **في GitHub Repository:**
1. اذهب إلى Settings → Secrets and variables → Actions
2. أضف Secrets التالية:

```env
# Android Build
KEYSTORE_PASSWORD=your_keystore_password
KEY_PASSWORD=your_key_password

# AI APIs
OPENAI_API_KEY=sk-your-openai-key
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key
E2B_API_KEY=e2b-your-e2b-key

# Security
SNYK_TOKEN=your_snyk_token
```

## 🎯 المميزات

### ✅ **Automation:**
- بناء تلقائي عند Push
- اختبارات تلقائية
- فحص أمان دوري
- توثيق تلقائي

### ✅ **Quality:**
- Linting للكود
- اختبارات شاملة
- فحص أمان
- تقارير مفصلة

### ✅ **Deployment:**
- APK جاهز للنشر
- Build artifacts محفوظة
- Releases منظمة
- تعليقات على PRs

### ✅ **Monitoring:**
- مراقبة حالة Workflows
- تقارير مفصلة
- تنبيهات للأخطاء
- تاريخ التنفيذ

## 📞 الدعم

إذا واجهت أي مشاكل:
1. تحقق من Actions tab في GitHub
2. راجع logs للخطأ المحدد
3. تأكد من صحة Secrets
4. أنشئ Issue جديد

---

**🎉 GitHub Actions جاهزة للاستخدام!**