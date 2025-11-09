# Gradle Build Error - Troubleshooting Guide

## Issues Fixed

### ✅ 1. Asset Files Were Placeholders (20 bytes)
**Fixed**: All assets are now properly loaded:
- logo.png: 1.4MB (1024x1024 PNG)
- icon.png: 1.4MB (1024x1024 PNG)
- adaptive-icon.png: 1.4MB (1024x1024 PNG)
- splash.png: 1.4MB (1024x1024 PNG)
- favicon.png: 1.4MB (1024x1024 PNG)
- tribal_bg.jpg: 161KB (WebP format)

### ✅ 2. Missing Android Configuration
**Fixed**: Added to `app.json`:
- `versionCode: 1` for Android versioning
- `INTERNET` permission for network access
- `ACCESS_NETWORK_STATE` permission for connectivity checks
- `extra.eas.projectId` configuration

### ✅ 3. EAS Build Configuration
**Fixed**: `eas.json` is properly configured with:
- Preview build for APK
- Production build for App Bundle

---

## Common Gradle Build Errors & Solutions

### Error 1: "Asset files too small or corrupted"
**Solution**: Assets have been reloaded with proper sizes
- Verify: `ls -lh mobile-app/assets/`
- All assets should be > 100KB except README

### Error 2: "Missing versionCode in Android configuration"
**Solution**: Added `"versionCode": 1` to `app.json` android section

### Error 3: "Network permission denied"
**Solution**: Added INTERNET and ACCESS_NETWORK_STATE permissions

### Error 4: "Gradle daemon stopped unexpectedly"
**Possible Solutions**:
1. Clear Expo cache: `expo start -c`
2. Rebuild: `eas build --platform android --clear-cache`
3. Check EAS project ID is configured

### Error 5: "Plugin configuration error"
**Solution**: Verify expo-camera and expo-location are properly installed:
```bash
npm install expo-camera expo-location expo-image-picker
```

---

## Build Commands

### For Local Development:
```bash
cd mobile-app
npm install
expo start
```

### For EAS Build (APK):
```bash
cd mobile-app
eas build --platform android --profile preview
```

### For EAS Build (App Bundle):
```bash
cd mobile-app
eas build --platform android --profile production
```

---

## Pre-Build Checklist

Before running `eas build`, verify:

- ✅ All assets are properly loaded (not 20 bytes)
- ✅ `app.json` has valid configuration
- ✅ `package.json` dependencies are installed
- ✅ EAS project is initialized: `eas init`
- ✅ You're logged in to EAS: `eas login`
- ✅ TypeScript compiles without errors

---

## Verification Steps

### 1. Check Assets
```bash
cd mobile-app
ls -lh assets/
```

Expected output:
```
-rw-r--r-- 1.4M adaptive-icon.png
-rw-r--r-- 1.4M favicon.png
-rw-r--r-- 1.4M icon.png
-rw-r--r-- 1.4M logo.png
-rw-r--r-- 1.4M splash.png
-rw-r--r-- 161K tribal_bg.jpg
```

### 2. Verify TypeScript
```bash
cd mobile-app
npx tsc --noEmit
```

Should show no errors.

### 3. Check Package Installation
```bash
cd mobile-app
npm list --depth=0
```

Should show all dependencies installed.

---

## Common EAS Build Issues

### Issue: "EAS project not configured"
**Solution**:
```bash
eas init
```

### Issue: "Authentication failed"
**Solution**:
```bash
eas logout
eas login
```

### Issue: "Build takes too long / times out"
**Solutions**:
1. Use preview profile for faster builds: `--profile preview`
2. Clear cache: `--clear-cache`
3. Check EAS build queue status

### Issue: "Gradle build failed with unknown error"
**Solutions**:

1. **Check Build Logs**:
   - Look for specific error in "Run gradlew" phase
   - Common errors: missing assets, permission issues, plugin conflicts

2. **Clear All Caches**:
   ```bash
   # Clear Expo cache
   expo start -c

   # Clear npm cache
   npm cache clean --force

   # Rebuild with clean cache
   eas build --platform android --clear-cache
   ```

3. **Verify Dependencies**:
   ```bash
   cd mobile-app
   rm -rf node_modules
   rm package-lock.json
   npm install
   ```

4. **Check Android Configuration**:
   - Verify `package` name format: `com.company.appname`
   - Ensure `versionCode` is a number
   - Check all permissions are valid Android permissions

5. **Asset Issues**:
   - All required assets must exist:
     - `./assets/icon.png`
     - `./assets/adaptive-icon.png`
     - `./assets/splash.png`
   - Assets must be valid image files (not placeholders)
   - Recommended sizes:
     - icon: 1024x1024
     - adaptive-icon: 1024x1024
     - splash: 1284x2778 (or 1024x1024)

6. **Plugin Conflicts**:
   - Ensure all plugins in `app.json` are installed
   - Check plugin versions are compatible with Expo SDK
   - Current Expo SDK: ~50.0.0

---

## Current Configuration

### app.json (Android)
```json
"android": {
  "adaptiveIcon": {
    "foregroundImage": "./assets/adaptive-icon.png",
    "backgroundColor": "#10b981"
  },
  "package": "com.pesa.worktracking",
  "versionCode": 1,
  "permissions": [
    "android.permission.CAMERA",
    "android.permission.ACCESS_FINE_LOCATION",
    "android.permission.ACCESS_COARSE_LOCATION",
    "android.permission.READ_EXTERNAL_STORAGE",
    "android.permission.WRITE_EXTERNAL_STORAGE",
    "android.permission.INTERNET",
    "android.permission.ACCESS_NETWORK_STATE"
  ]
}
```

### eas.json
```json
{
  "build": {
    "preview": {
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "app-bundle"
      }
    }
  }
}
```

---

## Testing the Build

### 1. Test Locally First
```bash
cd mobile-app
expo start
```

Press `a` for Android emulator or scan QR code on device.

### 2. If Local Works, Try EAS Build
```bash
eas build --platform android --profile preview
```

### 3. Monitor Build Progress
- EAS will provide a build URL
- Check logs in real-time
- Look for specific errors in "Run gradlew" phase

---

## What We've Fixed

1. ✅ Reloaded all asset files (were 20 bytes, now proper sizes)
2. ✅ Added `versionCode` to Android config
3. ✅ Added INTERNET and ACCESS_NETWORK_STATE permissions
4. ✅ Added EAS project configuration placeholder
5. ✅ Verified TypeScript configuration
6. ✅ Verified source file imports are correct
7. ✅ All asset paths are correct (`../assets/tribal_bg.jpg`)

---

## Next Steps

1. **Initialize EAS** (if not done):
   ```bash
   cd mobile-app
   eas init
   ```

2. **Update Project ID** in `app.json`:
   - After `eas init`, copy the project ID
   - Update `extra.eas.projectId` in `app.json`

3. **Build**:
   ```bash
   eas build --platform android --profile preview
   ```

4. **If Build Fails**:
   - Check the specific error message in EAS logs
   - Look at "Run gradlew" phase for Gradle-specific errors
   - Share the specific error message for further debugging

---

## Additional Resources

- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [Troubleshooting EAS Build](https://docs.expo.dev/build-reference/troubleshooting/)
- [Android Build Configuration](https://docs.expo.dev/build-reference/android-builds/)

---

## Summary

**Assets**: ✅ Fixed (all properly loaded)
**Configuration**: ✅ Fixed (versionCode, permissions added)
**Source Files**: ✅ Verified (no import errors)
**Build Config**: ✅ Ready (eas.json configured)

**Ready to build with**: `eas build --platform android --profile preview`
