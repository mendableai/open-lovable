# 📱 Open-Lovable Android App

نسخة Android Native من مشروع [Open-Lovable](https://github.com/mendableai/open-lovable) مبنية بـ React Native.

## 🚀 المميزات

- ✅ تطبيق Android Native حقيقي (ليس WebView)
- ✅ واجهة مستخدم مطابقة للإصدار الويب
- ✅ دعم كامل للـ TypeScript
- ✅ بناء تلقائي عبر GitHub Actions
- ✅ APK جاهز للتثبيت

## 📋 المتطلبات

- Android 7.0+ (API level 24)
- React Native 0.81.0
- Node.js 18+

## 🛠️ التطوير المحلي

### تثبيت التبعيات
```bash
npm install
```

### تشغيل التطبيق
```bash
# Android
npx react-native run-android

# iOS (إذا كان متاحاً)
npx react-native run-ios
```

## 🏗️ البناء للإنتاج

### عبر GitHub Actions (موصى به)

1. اذهب إلى إعدادات Repository → Secrets and variables → Actions
2. أضف Secrets التالية:
   ```
   KEYSTORE_PASSWORD: your_keystore_password
   KEY_PASSWORD: your_key_password
   ```
3. أنشئ Tag جديد: `git tag v1.0.0 && git push origin v1.0.0`
4. انتظر حتى يكتمل البناء في GitHub Actions
5. حمل APK من قسم Releases

### البناء المحلي

```bash
cd android
./gradlew assembleRelease
```

الملف سيكون في: `android/app/build/outputs/apk/release/app-release.apk`

## 📁 هيكل المشروع

```
OpenLovableApp/
├── src/
│   └── components/
│       ├── CodeApplicationProgress.tsx
│       └── SandboxPreview.tsx
├── android/
│   ├── app/
│   │   └── build.gradle
│   └── build.gradle
├── .github/
│   └── workflows/
│       └── android.yml
├── App.tsx
└── package.json
```

## 🔧 المكونات المحولة

### CodeApplicationProgress
- يعرض تقدم تطبيق الكود
- مؤشر تحميل دوار
- دعم للـ Animated API

### SandboxPreview
- معاينة Sandbox مع WebView
- دعم للـ Console Output
- أزرار التحكم (تحديث، فتح في المتصفح)

## 📱 التثبيت

1. حمل APK من [Releases](../../releases)
2. فعّل "Install from unknown sources" في إعدادات Android
3. ثبت التطبيق

## 🤝 المساهمة

1. Fork المشروع
2. أنشئ branch جديد: `git checkout -b feature/new-feature`
3. اكتب التغييرات: `git commit -am 'Add new feature'`
4. ادفع التغييرات: `git push origin feature/new-feature`
5. أنشئ Pull Request

## 📄 الترخيص

هذا المشروع مرخص تحت [MIT License](LICENSE).

## 🙏 الشكر

- [React Native](https://reactnative.dev/)
- [Open-Lovable](https://github.com/mendableai/open-lovable)
- [GitHub Actions](https://github.com/features/actions)

---

**🎉 تم بناؤه بـ ❤️ باستخدام React Native**
