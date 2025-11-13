# Running PESA Mobile App in Android Studio

## Important: This is an Expo App

This mobile app is built with **Expo**, not pure React Native. You **cannot** directly open it in Android Studio like a native Android project.

---

## ✅ Recommended Method: Use Expo Go App

This is the **fastest and easiest** way to test the app locally:

### Step 1: Install Dependencies

```bash
cd /path/to/project/mobile-app
npm install
```

### Step 2: Install Expo CLI Globally

```bash
npm install -g expo-cli
```

### Step 3: Install Expo Go on Your Phone

**On Android Device:**
1. Open Google Play Store
2. Search for "Expo Go"
3. Install the app
4. Open it

### Step 4: Start Development Server

```bash
cd /path/to/project/mobile-app
npm start
# or
expo start
```

You'll see a QR code in the terminal.

### Step 5: Scan QR Code

**On Android:**
1. Open Expo Go app
2. Tap "Scan QR Code"
3. Point camera at QR code in terminal
4. App will load on your device

**That's it!** The app will reload automatically when you save code changes.

---

## 🔧 Alternative: Use Android Emulator (Through Expo)

If you want to use an Android emulator:

### Step 1: Setup Android Studio Emulator

1. Install Android Studio from https://developer.android.com/studio
2. Open Android Studio
3. Go to **Tools → Device Manager**
4. Click **Create Device**
5. Choose a phone (e.g., Pixel 5)
6. Download a system image (e.g., Android 13)
7. Finish setup and launch the emulator

### Step 2: Run Expo with Emulator

```bash
cd /path/to/project/mobile-app
npm start
```

When Metro bundler opens, press **`a`** to open on Android emulator.

Or run directly:
```bash
npm run android
```

The emulator will launch automatically and load your app.

---

## ⚠️ Cannot Use Android Studio Directly

**Why?**

This is an **Expo managed workflow** app, not a bare React Native app:

- ❌ No `android/` folder with native code
- ❌ Cannot open as Android Studio project
- ❌ No Gradle files for Android Studio
- ✅ Uses Expo's build service
- ✅ Runs through Expo Go or Expo Dev Client

---

## 🏗️ To Open in Android Studio (Advanced)

If you **really need** to open in Android Studio, you must **eject from Expo**:

### ⚠️ WARNING: This is irreversible and complex!

```bash
cd /path/to/project/mobile-app
npx expo prebuild
```

This will:
1. Generate native `android/` and `ios/` folders
2. Convert to bare React Native workflow
3. Allow opening in Android Studio
4. **Break** many Expo features

**After ejecting:**
```bash
# Open Android Studio
# File → Open → Select mobile-app/android folder
```

**We don't recommend this unless you have specific native development needs.**

---

## 📱 Recommended Development Setup

### For Testing on Real Device:

```bash
# Terminal 1: Start dev server
cd mobile-app
npm start

# On phone: Scan QR code with Expo Go
```

### For Testing on Emulator:

```bash
# Start Android emulator from Android Studio first
# Then:
cd mobile-app
npm run android
```

---

## 🐛 Troubleshooting

### "Cannot connect to Metro"

1. Make sure your phone and computer are on the same WiFi
2. Check firewall settings
3. Try running: `expo start --tunnel`

### "Error loading app"

```bash
# Clear cache and restart
expo start -c
```

### Emulator not detected

```bash
# Check if emulator is running
adb devices

# Should show:
# List of devices attached
# emulator-5554   device
```

### Can't install Expo CLI

```bash
# Try with sudo (Mac/Linux)
sudo npm install -g expo-cli

# Or use npx (no global install needed)
npx expo start
```

---

## 🚀 Quick Start Commands

**Most Common:**
```bash
cd mobile-app
npm install           # First time only
npm start            # Start dev server
# Then scan QR code with Expo Go app
```

**With Android Emulator:**
```bash
cd mobile-app
npm run android      # Opens on Android emulator automatically
```

**Clear Cache:**
```bash
npm start -- --clear
```

**Run on Specific Device:**
```bash
expo start --android --device
```

---

## 📦 Building APK for Distribution

When ready to create an installable APK:

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Build APK
eas build --platform android --profile preview
```

See `QUICK_START.md` for detailed build instructions.

---

## 📋 Development Workflow

1. **Edit code** in VS Code or your preferred editor
2. **Save file** - app reloads automatically
3. **Check phone/emulator** - see changes immediately
4. **Debug** with console logs or React Native Debugger
5. **Repeat**

---

## 🎯 Key Points

✅ Use **Expo Go** app for easiest testing
✅ Use **Android Studio emulator** with Expo commands
❌ Don't try to open in Android Studio directly
❌ Don't eject unless absolutely necessary

---

## 📞 Need Help?

**Check Expo Documentation:**
- https://docs.expo.dev/get-started/installation/
- https://docs.expo.dev/workflow/android-studio-emulator/

**Common Commands:**
```bash
npm start              # Start dev server
npm run android        # Open on Android
expo start --clear     # Clear cache
expo doctor            # Check for issues
```

---

## 🎉 You're Ready!

**To get started right now:**

```bash
cd mobile-app
npm install
npm start
```

Then scan the QR code with Expo Go app on your phone!
