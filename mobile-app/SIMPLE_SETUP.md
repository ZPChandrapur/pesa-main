# Simple Setup - Test App in 5 Minutes

## You Cannot Open This in Android Studio Directly

This is an **Expo app**, not a native Android project. Follow these steps instead:

---

## Method 1: Test on Your Phone (Easiest)

### Step 1: Install Node Packages

Open Terminal/Command Prompt and run:

```bash
cd mobile-app
npm install
```

Wait for installation to complete (2-3 minutes).

### Step 2: Install Expo Go on Your Phone

**On your Android phone:**
1. Open **Play Store**
2. Search for **"Expo Go"**
3. Install it
4. Open the app

### Step 3: Start the App

In Terminal/Command Prompt:

```bash
npm start
```

You'll see:
```
› Metro waiting on exp://192.168.x.x:8081
› Scan the QR code above with Expo Go (Android) or the Camera app (iOS)
```

### Step 4: Scan QR Code

**On your Android phone:**
1. Open **Expo Go** app
2. Tap **"Scan QR code"**
3. Point camera at the QR code in your terminal
4. App will load in 10-20 seconds

**Done!** The app is running on your phone.

---

## Method 2: Test on Android Emulator

### Step 1: Install Android Studio

1. Download from: https://developer.android.com/studio
2. Install and open Android Studio
3. Complete the setup wizard

### Step 2: Create Virtual Device

1. In Android Studio, click **More Actions → Virtual Device Manager**
2. Click **Create Device**
3. Select **Pixel 5** (or any phone)
4. Click **Next**
5. Download **Android 13** (API 33) system image
6. Click **Next → Finish**
7. Click the **Play** button to start emulator

### Step 3: Install Dependencies

```bash
cd mobile-app
npm install
```

### Step 4: Run on Emulator

```bash
npm run android
```

The app will open automatically on the emulator (takes 30-60 seconds first time).

**Done!** The app is running on the emulator.

---

## What You'll See

When the app loads:

1. **Login Screen**
   - Email field
   - Password field
   - Login button

2. After login:
   - Work Dashboard
   - Workflow Progress
   - Navigation menu

---

## Making Changes

### Edit Code

1. Open any file in the `src/` folder
2. Make changes
3. Save the file
4. App **reloads automatically** on your phone/emulator

### View Console Logs

Press **`j`** in the terminal where Metro is running to open debugger.

---

## Stop the App

In the terminal where you ran `npm start`:
- Press **`Ctrl + C`** to stop

---

## Troubleshooting

### "Cannot connect to Metro"

**Solution:**
```bash
npm start -- --tunnel
```
Then scan the new QR code.

### "Expo Go not working"

**Solution:**
```bash
# Clear cache and restart
npm start -- --clear
```

### Emulator not detected

**Solution:**
1. Make sure emulator is running (green play button in Android Studio)
2. Run this to check:
```bash
adb devices
```
Should show: `emulator-5554   device`

### Port already in use

**Solution:**
```bash
# Kill the process and restart
npx kill-port 8081 19000 19001 19002
npm start
```

---

## Key Differences from Android Studio

| Android Studio Project | This Expo App |
|------------------------|---------------|
| Opens in Android Studio | Cannot open directly |
| Has `android/` folder | No `android/` folder |
| Uses Gradle | Uses Expo CLI |
| Run button in IDE | Run from terminal |
| Edit in Android Studio | Edit in any text editor |

---

## Quick Commands Reference

```bash
# Install dependencies (first time only)
npm install

# Start development server
npm start

# Run on Android emulator (must be running)
npm run android

# Clear cache and restart
npm start -- --clear

# Check for issues
npx expo doctor
```

---

## ✅ Recommended Workflow

**For daily development:**

1. Open your code editor (VS Code, Sublime, etc.)
2. Open a terminal
3. Run: `npm start`
4. Scan QR code with Expo Go on your phone
5. Edit code → Save → See changes instantly

**For emulator testing:**

1. Start Android emulator from Android Studio
2. Open terminal
3. Run: `npm run android`
4. Edit code → Save → See changes instantly

---

## Building APK for Installation

When you want an installable APK file:

```bash
# Install EAS CLI
npm install -g eas-cli

# Login
eas login

# Build APK (takes 15-20 minutes)
eas build --platform android --profile preview

# Download link will be provided when done
```

See `QUICK_START.md` for detailed instructions.

---

## Summary

**This is NOT a native Android Studio project.**

**Instead:**
- ✅ Use **Expo Go** app for testing on phone
- ✅ Use **npm run android** for emulator testing
- ✅ Use **any code editor** to write code
- ❌ Don't try to open in Android Studio as a project

**To start right now:**
```bash
cd mobile-app
npm install
npm start
# Scan QR code with Expo Go app
```

---

## Need More Help?

Read the full guide: `ANDROID_STUDIO_SETUP.md`

Or check Expo docs: https://docs.expo.dev/
