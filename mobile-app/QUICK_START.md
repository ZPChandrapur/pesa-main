# Quick Start Guide - Build APK Today

## Step-by-Step Instructions to Build APK

### 1. Open Terminal/Command Prompt

Navigate to the mobile app folder:

```bash
cd /path/to/project/mobile-app
```

### 2. Install Dependencies (5 minutes)

```bash
npm install
```

Wait for all packages to download and install.

### 3. Install Global Tools (2 minutes)

```bash
npm install -g eas-cli expo-cli
```

### 4. Create Expo Account (2 minutes)

If you don't have one:
1. Go to https://expo.dev/signup
2. Create free account
3. Remember your username and password

### 5. Login to Expo (1 minute)

```bash
eas login
```

Enter your Expo credentials when prompted.

### 6. Configure Build (First Time Only)

```bash
eas build:configure
```

Press **Enter** to accept defaults for all questions.

### 7. Build APK (15-20 minutes)

```bash
eas build --platform android --profile preview
```

This will:
- Upload your code to Expo's cloud servers
- Build the APK automatically
- Provide a download link when complete

**What to expect:**
```
✔ Build started, it may take a few minutes to complete.
✔ You can monitor the build at:
  https://expo.dev/accounts/[your-account]/projects/pesa-work-tracking/builds/[build-id]
```

### 8. Download APK

Once build completes:
1. Click the provided link or check your Expo dashboard
2. Download the APK file
3. File size will be around 40-60 MB

### 9. Install on Android Device

**Method A: Via USB**
1. Connect Android device to computer
2. Copy APK file to device
3. Open file manager on device
4. Tap APK file
5. Allow "Install from Unknown Sources" if prompted
6. Tap Install

**Method B: Via Direct Download**
1. Share the Expo download link to device
2. Open link on Android device
3. Download APK
4. Tap downloaded file
5. Allow "Install from Unknown Sources"
6. Tap Install

## Testing the App

1. **Open the app** on your device
2. **Grant permissions** when prompted:
   - Camera access
   - Location access
   - Storage access
3. **Login** with Supabase credentials
4. **Test features**:
   - View Work Dashboard
   - Check Workflow Progress
   - Edit a step
   - Take photo
   - Capture location

## Offline Testing

1. Turn on Airplane Mode
2. Edit a workflow step
3. Take photos
4. Capture location
5. Save changes
6. Turn off Airplane Mode
7. Changes will auto-sync

## Sharing the APK

### Option 1: Direct File Sharing
- Send APK file via WhatsApp, Email, or Google Drive
- Recipient downloads and installs

### Option 2: Web Hosting
- Upload APK to your website
- Share download link
- Users download and install

### Option 3: QR Code
- Use Expo's share link
- Generate QR code
- Users scan and download

## Common Issues

### Build Fails
```bash
# Clear and retry
npm install
eas build --platform android --profile preview --clear-cache
```

### Can't Install APK
- Enable "Install from Unknown Sources" in Android Settings
- Check device storage (need ~100MB free)

### App Crashes
- Grant all permissions
- Check internet connection
- Verify Supabase credentials

## Build Status Check

While waiting for build, monitor at:
```
https://expo.dev/accounts/[your-username]/projects/pesa-work-tracking/builds
```

## Estimated Timeline

- Setup: **10 minutes**
- Build: **15-20 minutes**
- Download & Install: **5 minutes**
- **Total: 30-35 minutes**

## After Building APK

### Next Steps for Play Store:

1. **Create Google Play Developer Account** ($25 one-time)
   - Go to https://play.google.com/console
   - Complete registration

2. **Prepare Store Listing Materials**:
   - App icon (512x512 PNG)
   - Screenshots (at least 2)
   - Feature graphic (1024x500)
   - App description
   - Privacy policy URL

3. **Build AAB for Play Store**:
   ```bash
   eas build --platform android --profile production
   ```

4. **Upload to Play Console**:
   - Create new app
   - Upload AAB file
   - Complete store listing
   - Submit for review

5. **Review Time**: 1-7 days

## Need Help?

Check README.md for detailed documentation and troubleshooting.

---

**Ready to build?** Run: `eas build --platform android --profile preview`
