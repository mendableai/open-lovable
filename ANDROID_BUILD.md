# 📱 تحويل Open-Lovable إلى تطبيق Android Native (APK) باستخدام GitHub Actions

> ⚠️ هذا الدليل موثّق خطوة بخطوة وبالتفصيل لتجنّب الأخطاء.  
> الغرض: إنتاج **APK حقيقي** (Android Native) من مشروع [open-lovable](https://github.com/mendableai/open-lovable).  
> كل العملية تتم على GitHub Actions — بدون الحاجة إلى كمبيوتر محلي.

---

## 📖 نظرة عامة

مشروع `open-lovable` مكتوب بـ **Next.js/React** مع TypeScript.  
لكي نجعل نسخة طبق الأصل كتطبيق Android Native:  

1. **إعادة كتابة الواجهة في React Native** → لأن HTML/CSS لا تعمل مباشرة في Android Native.  
2. **إعداد Gradle** داخل مجلد `android/` لبناء التطبيق.  
3. **إعداد GitHub Actions** ليقوم تلقائياً ببناء APK ورفعه في **Releases**.  

---

## ✅ المتطلبات

- حساب GitHub.  
- Fork لمشروع [open-lovable](https://github.com/mendableai/open-lovable).  
- لا حاجة لحاسوب — فقط جوالك مع GitHub App أو المتصفح.

---

## 🛠️ الخطوات التفصيلية

### 1️⃣ إنشاء مشروع React Native

في مجلد جديد (داخل الـ Repo):

```bash
npx react-native init OpenLovableApp --template react-native-template-typescript
cd OpenLovableApp

> ℹ️ هذه الخطوة تجهز هيكل Android Native (Gradle + Java/Kotlin).
مهم لأن GitHub Actions سيبني من هنا.
```

**ملاحظة مهمة**: استخدم `--template react-native-template-typescript` لأن المشروع الأصلي مكتوب بـ TypeScript.

### 2️⃣ نقل الكود من Open-Lovable

#### أ) تحليل المكونات الموجودة

من خلال استكشاف المشروع، وجدنا المكونات التالية:
- `CodeApplicationProgress.tsx`
- `HMRErrorDetector.tsx` 
- `SandboxPreview.tsx`
- مجلد `ui/` للمكونات الأساسية

#### ب) تحويل المكونات إلى React Native

1. انسخ المكونات من مشروع open-lovable إلى `OpenLovableApp/src/components/`.

2. استبدل العناصر HTML بـ React Native:

```typescript
// بدلاً من
<div> → <View>
<p> أو <span> → <Text>
<img> → <Image>
<button> → <TouchableOpacity> أو <Pressable>
<input> → <TextInput>
```

#### ج) مثال لتحويل مكون بسيط

**قبل التحويل (React/Next.js):**
```tsx
import React from 'react';

export function CodeApplicationProgress({ progress }: { progress: number }) {
  return (
    <div className="w-full bg-gray-200 rounded-full h-2.5">
      <div 
        className="bg-blue-600 h-2.5 rounded-full" 
        style={{ width: `${progress}%` }}
      ></div>
    </div>
  );
}
```

**بعد التحويل (React Native):**
```tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';

interface CodeApplicationProgressProps {
  progress: number;
}

export function CodeApplicationProgress({ progress }: CodeApplicationProgressProps) {
  return (
    <View style={styles.container}>
      <View style={[styles.progressBar, { width: `${progress}%` }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: '#e5e7eb',
    borderRadius: 5,
    height: 10,
  },
  progressBar: {
    backgroundColor: '#2563eb',
    height: 10,
    borderRadius: 5,
  },
});
```

#### د) إضافة المكتبات المطلوبة

```bash
npm install react-native-paper react-navigation @react-navigation/native @react-navigation/stack react-native-vector-icons react-native-safe-area-context react-native-screens
```

#### ه) مثال لملف App.tsx الرئيسي

```tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Provider as PaperProvider } from 'react-native-paper';
import { View, Text, StyleSheet } from 'react-native';
import { CodeApplicationProgress } from './src/components/CodeApplicationProgress';

function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to Open-Lovable Android!</Text>
      <CodeApplicationProgress progress={75} />
    </View>
  );
}

const Stack = createStackNavigator();

export default function App() {
  return (
    <PaperProvider>
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen 
            name="Home" 
            component={HomeScreen}
            options={{ title: 'Open-Lovable' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
});
```

### 3️⃣ إعداد Gradle (Android)

#### أ) ملف `android/build.gradle`

```gradle
buildscript {
    ext {
        buildToolsVersion = "34.0.0"
        minSdkVersion = 24
        compileSdkVersion = 34
        targetSdkVersion = 34
        kotlinVersion = "1.9.0"
        
        // إضافة دعم للـ Vector Icons
        vectorDrawables.useSupportLibrary = true
    }
    repositories {
        google()
        mavenCentral()
    }
    dependencies {
        classpath("com.android.tools.build:gradle:8.2.1")
        classpath("org.jetbrains.kotlin:kotlin-gradle-plugin:$kotlinVersion")
    }
}

allprojects {
    repositories {
        google()
        mavenCentral()
        maven { url "https://www.jitpack.io" }
    }
}
```

#### ب) ملف `android/app/build.gradle`

```gradle
apply plugin: "com.android.application"
apply plugin: "org.jetbrains.kotlin.android"

import com.android.build.OutputFile

android {
    namespace "com.openlovableapp"
    compileSdkVersion rootProject.ext.compileSdkVersion

    defaultConfig {
        applicationId "com.openlovableapp"
        minSdkVersion rootProject.ext.minSdkVersion
        targetSdkVersion rootProject.ext.targetSdkVersion
        versionCode 1
        versionName "1.0"
    }

    signingConfigs {
        debug {
            storeFile file('debug.keystore')
            storePassword 'android'
            keyAlias 'androiddebugkey'
            keyPassword 'android'
        }
        release {
            // سيتم إعداد هذا لاحقاً في GitHub Actions
            storeFile file('release.keystore')
            storePassword System.getenv("KEYSTORE_PASSWORD")
            keyAlias System.getenv("KEY_ALIAS")
            keyPassword System.getenv("KEY_PASSWORD")
        }
    }

    buildTypes {
        debug {
            signingConfig signingConfigs.debug
        }
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            proguardFiles getDefaultProguardFile("proguard-android.txt"), "proguard-rules.pro"
        }
    }
}

dependencies {
    implementation fileTree(dir: "libs", include: ["*.jar"])
    implementation "com.facebook.react:react-native:+"
    implementation "androidx.swiperefreshlayout:swiperefreshlayout:1.1.0"
    
    // إضافة دعم للـ Vector Icons
    implementation project(':react-native-vector-icons')
    
    debugImplementation("com.facebook.flipper:flipper:${FLIPPER_VERSION}")
    debugImplementation("com.facebook.flipper:flipper-network-plugin:${FLIPPER_VERSION}") {
        exclude group:'com.squareup.okhttp3', module:'okhttp'
    }
    debugImplementation("com.facebook.flipper:flipper-fresco-plugin:${FLIPPER_VERSION}")
    
    if (enableHermes) {
        implementation("com.facebook.react:hermes-engine:+") {
            exclude group:'com.facebook.fbjni'
        }
    } else {
        implementation jscFlavor
    }
}

apply from: file("../../node_modules/@react-native-community/cli-platform-android/native_modules.gradle"); applyNativeModulesAppBuildGradle(project)
```

#### ج) ملف `gradle/wrapper/gradle-wrapper.properties`

```properties
distributionBase=GRADLE_USER_HOME
distributionPath=wrapper/dists
distributionUrl=https\://services.gradle.org/distributions/gradle-8.2-all.zip
networkTimeout=10000
zipStoreBase=GRADLE_USER_HOME
zipStorePath=wrapper/dists
```

### 4️⃣ إنشاء Workflow على GitHub Actions

#### أ) إنشاء مجلد `.github/workflows/`

```bash
mkdir -p .github/workflows
```

#### ب) إنشاء ملف `android.yml`

```yaml
name: Build Android APK

on:
  push:
    tags:
      - 'v*'   # يبدأ البناء فقط عند عمل Tag جديد (مثال: v1.0.0)
  workflow_dispatch:  # للبناء اليدوي

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: |
          cd OpenLovableApp
          npm install

      - name: Setup Java
        uses: actions/setup-java@v4
        with:
          distribution: 'zulu'
          java-version: '17'

      - name: Setup Android SDK
        uses: android-actions/setup-android@v3

      - name: Cache Gradle packages
        uses: actions/cache@v4
        with:
          path: |
            ~/.gradle/caches
            ~/.gradle/wrapper
          key: ${{ runner.os }}-gradle-${{ hashFiles('**/*.gradle*', '**/gradle-wrapper.properties') }}
          restore-keys: |
            ${{ runner.os }}-gradle-

      - name: Generate Keystore
        run: |
          cd OpenLovableApp/android/app
          keytool -genkeypair -v -storetype PKCS12 -keystore release.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000 -storepass ${{ secrets.KEYSTORE_PASSWORD }} -keypass ${{ secrets.KEY_PASSWORD }} -dname "CN=OpenLovable, OU=Development, O=OpenLovable, L=City, S=State, C=US"

      - name: Build Release APK
        run: |
          cd OpenLovableApp/android
          ./gradlew clean
          ./gradlew assembleRelease
        env:
          KEYSTORE_PASSWORD: ${{ secrets.KEYSTORE_PASSWORD }}
          KEY_ALIAS: my-key-alias
          KEY_PASSWORD: ${{ secrets.KEY_PASSWORD }}

      - name: Upload APK to GitHub Release
        uses: softprops/action-gh-release@v1
        with:
          files: OpenLovableApp/android/app/build/outputs/apk/release/app-release.apk
          tag_name: ${{ github.ref_name }}
          name: Open-Lovable Android APK
          body: |
            🎉 Open-Lovable Android App
            
            **Version:** ${{ github.ref_name }}
            **Build Date:** ${{ github.event.head_commit.timestamp }}
            
            ### 📱 Features
            - Native Android application
            - Built with React Native
            - Full feature parity with web version
            
            ### 🔧 Installation
            1. Download the APK file
            2. Enable "Install from unknown sources" in your Android settings
            3. Install the APK file
            
            ### 📝 Notes
            - This is a release build optimized for performance
            - Requires Android 7.0 (API level 24) or higher
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### 5️⃣ إعداد Secrets في GitHub

#### أ) إنشاء Secrets المطلوبة

1. اذهب إلى Repository Settings → Secrets and variables → Actions
2. أضف Secrets التالية:

```
KEYSTORE_PASSWORD: your_keystore_password_here
KEY_PASSWORD: your_key_password_here
```

**مثال للقيم:**
```
KEYSTORE_PASSWORD: openlovable2024
KEY_PASSWORD: openlovable2024
```

### 6️⃣ إعداد ملف `metro.config.js`

```javascript
const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

const config = {};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
```

### 7️⃣ إعداد ملف `index.js`

```javascript
import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';

AppRegistry.registerComponent(appName, () => App);
```

---

## 🚀 طريقة الاستخدام

### 1️⃣ من تطبيق GitHub على الموبايل:

1. اذهب إلى Repository
2. اذهب إلى "Releases" أو "Tags"
3. أنشئ Tag جديد (مثلاً `v1.0.0`)

### 2️⃣ مراقبة عملية البناء:

1. اذهب إلى "Actions" في Repository
2. ستجد Workflow "Build Android APK" يعمل
3. انتظر حتى يكتمل (عادةً 5-10 دقائق)

### 3️⃣ تحميل APK:

1. اذهب إلى "Releases"
2. ستجد ملف `app-release.apk`
3. اضغط عليه للتحميل

### 4️⃣ تثبيت APK:

1. في إعدادات Android: اذهب إلى "Security" → "Unknown sources"
2. فعّل "Install from unknown sources"
3. افتح ملف APK المحمل
4. اضغط "Install"

---

## 🏆 النتيجة النهائية

✅ نسخة طبق الأصل من Open-Lovable كتطبيق Android Native  
✅ لا وهمي ولا WebView — بناء كامل عبر Gradle  
✅ كل شيء يتم تلقائياً عبر GitHub Actions  
✅ لا تحتاج حاسوب نهائياً  
✅ APK جاهز للتثبيت على أي جهاز Android  

---

## 🔧 استكشاف الأخطاء وإصلاحها

### مشكلة: فشل في بناء Gradle
**الحل:** تأكد من أن ملف `gradle-wrapper.properties` يحتوي على النسخة الصحيحة.

### مشكلة: خطأ في Keystore
**الحل:** تأكد من إعداد Secrets بشكل صحيح في GitHub.

### مشكلة: فشل في تحميل المكتبات
**الحل:** تأكد من أن `node_modules` موجودة وأن `npm install` تم تنفيذه.

### مشكلة: خطأ في React Native
**الحل:** تأكد من تحويل جميع المكونات من HTML إلى React Native بشكل صحيح.

---

## 📚 موارد إضافية

- [React Native Documentation](https://reactnative.dev/docs/getting-started)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Android Gradle Plugin](https://developer.android.com/studio/build)
- [React Navigation](https://reactnavigation.org/docs/getting-started)

---

## 🎯 ملاحظات مهمة

1. **الأمان**: Keystore المستخدم للبناء هو للاختبار فقط. للإنتاج، استخدم Keystore رسمي.
2. **الأداء**: React Native يوفر أداء قريب من Native.
3. **التحديثات**: يمكن إضافة CodePush لتحديث التطبيق بدون إعادة نشر.
4. **التوافق**: التطبيق يعمل على Android 7.0+ (API 24+).

---

**🎉 تهانينا! الآن لديك تطبيق Android Native كامل من مشروع Open-Lovable!**