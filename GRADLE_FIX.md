# 🔧 إصلاح مشكلة vectorDrawables في Gradle

## المشكلة
كانت هناك مشكلة في إعداد Gradle للـ Android حيث كان `vectorDrawables.useSupportLibrary = true` موجود في المكان الخطأ، مما تسبب في خطأ:

```
Could not get unknown property 'vectorDrawables' for object of type org.gradle.internal.extensibility.DefaultExtraPropertiesExtension.
```

## الحل
تم نقل `vectorDrawables.useSupportLibrary = true` من `OpenLovableApp/android/build.gradle` إلى `OpenLovableApp/android/app/build.gradle` داخل `defaultConfig` block.

### التغييرات المطلوبة:

1. **إزالة من `OpenLovableApp/android/build.gradle`:**
   ```gradle
   buildscript {
       ext {
           buildToolsVersion = "34.0.0"
           minSdkVersion = 24
           compileSdkVersion = 34
           targetSdkVersion = 34
           kotlinVersion = "1.9.0"
           
           // إضافة دعم للـ Vector Icons
           vectorDrawables.useSupportLibrary = true  // ❌ تم إزالته
       }
   }
   ```

2. **إضافة إلى `OpenLovableApp/android/app/build.gradle`:**
   ```gradle
   defaultConfig {
       applicationId "com.openlovableapp"
       minSdkVersion rootProject.ext.minSdkVersion
       targetSdkVersion rootProject.ext.targetSdkVersion
       versionCode 1
       versionName "1.0"
       
       // إضافة دعم للـ Vector Icons
       vectorDrawables.useSupportLibrary = true  // ✅ تم إضافته هنا
   }
   ```

3. **إضافة react-native-vector-icons إلى `OpenLovableApp/android/settings.gradle`:**
   ```gradle
   include ':react-native-vector-icons'
   project(':react-native-vector-icons').projectDir = new File(rootProject.projectDir, '../node_modules/react-native-vector-icons/android')
   ```

4. **إضافة react-native-vector-icons إلى `package.json` الرئيسي:**
   ```json
   "react-native-vector-icons": "^10.3.0"
   ```

5. **إزالة التكرار في `jscFlavor`:**
   تم إزالة التكرار في تعريف `jscFlavor` في `OpenLovableApp/android/app/build.gradle`.

## النتيجة
الآن يجب أن يعمل بناء Android بدون أخطاء Gradle. المشكلة كانت في وضع `vectorDrawables.useSupportLibrary = true` في المكان الخطأ - يجب أن يكون في `defaultConfig` داخل `android/app/build.gradle` وليس في `ext` داخل `android/build.gradle`.

## الملفات المتأثرة:
- `OpenLovableApp/android/build.gradle` - إزالة vectorDrawables
- `OpenLovableApp/android/app/build.gradle` - إضافة vectorDrawables + إزالة تكرار jscFlavor
- `OpenLovableApp/android/settings.gradle` - إضافة react-native-vector-icons
- `package.json` - إضافة react-native-vector-icons dependency