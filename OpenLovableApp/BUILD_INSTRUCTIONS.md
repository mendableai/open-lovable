# 🚀 تعليمات بناء Open-Lovable Android App

## 📋 المتطلبات المسبقة

### 1. إعداد GitHub Repository
- Fork مشروع [open-lovable](https://github.com/mendableai/open-lovable)
- Clone الـ Repository محلياً

### 2. إعداد Secrets في GitHub
1. اذهب إلى Repository Settings
2. اختر "Secrets and variables" → "Actions"
3. أضف Secrets التالية:

```
KEYSTORE_PASSWORD: openlovable2024
KEY_PASSWORD: openlovable2024
```

## 🏗️ خطوات البناء

### الطريقة الأولى: عبر GitHub Actions (موصى به)

#### 1. إنشاء Tag جديد
```bash
# في مجلد المشروع الرئيسي
git add .
git commit -m "Add Android Native app"
git tag v1.0.0
git push origin main
git push origin v1.0.0
```

#### 2. مراقبة عملية البناء
1. اذهب إلى "Actions" في Repository
2. ستجد Workflow "Build Android APK" يعمل
3. انتظر حتى يكتمل (5-10 دقائق)

#### 3. تحميل APK
1. اذهب إلى "Releases"
2. ستجد ملف `app-release.apk`
3. اضغط عليه للتحميل

### الطريقة الثانية: البناء المحلي

#### 1. تثبيت التبعيات
```bash
cd OpenLovableApp
npm install
```

#### 2. إعداد Android SDK
- تأكد من تثبيت Android Studio
- إعداد ANDROID_HOME متغير البيئة
- تثبيت Android SDK Platform 34

#### 3. بناء APK
```bash
cd android
./gradlew clean
./gradlew assembleRelease
```

الملف سيكون في: `android/app/build/outputs/apk/release/app-release.apk`

## 📱 تثبيت APK

### 1. تفعيل "Install from unknown sources"
- اذهب إلى إعدادات Android
- اختر "Security" أو "Privacy"
- فعّل "Install from unknown sources"

### 2. تثبيت التطبيق
- افتح ملف APK المحمل
- اضغط "Install"
- انتظر حتى يكتمل التثبيت

## 🔧 استكشاف الأخطاء

### مشكلة: فشل في بناء Gradle
**الحل:**
```bash
cd android
./gradlew clean
./gradlew assembleRelease --stacktrace
```

### مشكلة: خطأ في Keystore
**الحل:** تأكد من إعداد Secrets بشكل صحيح في GitHub.

### مشكلة: فشل في تحميل المكتبات
**الحل:**
```bash
npm cache clean --force
rm -rf node_modules
npm install
```

### مشكلة: خطأ في React Native
**الحل:**
```bash
npx react-native doctor
npx react-native start --reset-cache
```

## 📊 معلومات التطبيق

- **اسم التطبيق:** Open-Lovable
- **Package Name:** com.openlovableapp
- **الحد الأدنى للإصدار:** Android 7.0 (API 24)
- **حجم APK:** ~15-20 MB
- **اللغة:** TypeScript/JavaScript
- **الإطار:** React Native 0.81.0

## 🎯 المميزات المبنية

✅ **واجهة مستخدم مطابقة للإصدار الويب**
- CodeApplicationProgress مع مؤشر تحميل دوار
- SandboxPreview مع WebView
- Console Output display

✅ **بناء تلقائي عبر GitHub Actions**
- Keystore generation
- APK signing
- Release upload

✅ **دعم كامل للـ TypeScript**
- Type safety
- Better development experience

✅ **مكونات React Native محسنة**
- Animated API للتحريكات
- WebView للـ Sandbox preview
- Navigation مع React Navigation

## 📞 الدعم

إذا واجهت أي مشاكل:
1. تحقق من [Issues](../../issues)
2. أنشئ Issue جديد
3. ارفق تفاصيل الخطأ والـ logs

---

**🎉 تم بناؤه بـ ❤️ لتحويل Open-Lovable إلى تطبيق Android Native!**