# PESA Work Tracking Mobile App

A React Native mobile application for tracking PESA work progress with offline capabilities, camera integration, and GPS location tracking.

## Features

- ✅ **2 Main Tabs**: Work Dashboard & Workflow Progress
- ✅ **Filters**: Gram Panchayat, Village, Taluka, Work Category, Status
- ✅ **Role-Based Access**: Integrated with Supabase authentication
- ✅ **Camera Integration**: Capture work progress photos
- ✅ **GPS Location**: Track work site locations
- ✅ **Offline Support**: Forms can be filled offline and auto-sync when online
- ✅ **Touch-Optimized UI**: Mobile-friendly cards and interactions

## Prerequisites

Before building the app, ensure you have:

1. **Node.js** (v18 or higher)
   ```bash
   node --version
   ```

2. **npm** or **yarn**
   ```bash
   npm --version
   ```

3. **Expo CLI** (will be installed in steps below)

4. **For Android APK**:
   - No additional requirements (uses Expo cloud build)

5. **For iOS**:
   - macOS computer
   - Xcode installed (from App Store)
   - Apple Developer Account ($99/year)

## Installation Steps

### 1. Navigate to Mobile App Directory

```bash
cd mobile-app
```

### 2. Install Dependencies

```bash
npm install
```

This will install all required packages including:
- React Native & Expo
- Supabase client
- Navigation libraries
- Camera and Location modules
- Offline storage

### 3. Install Expo CLI Globally

```bash
npm install -g expo-cli
```

### 4. Install EAS CLI for Building

```bash
npm install -g eas-cli
```

### 5. Login to Expo Account

```bash
eas login
```

If you don't have an Expo account:
1. Go to https://expo.dev/signup
2. Create a free account
3. Then run `eas login` with your credentials

## Building the App

### Option A: Build APK for Android (Recommended for Quick Distribution)

This creates an APK file you can distribute directly without Play Store.

```bash
# Configure EAS Build (first time only)
eas build:configure

# Build APK for Android
eas build --platform android --profile preview
```

**What happens**:
1. Code is uploaded to Expo's build servers
2. Android APK is built in the cloud (~10-15 minutes)
3. Download link is provided
4. APK can be installed on any Android device

**Download & Install**:
1. Once build completes, download the APK file
2. Transfer to Android device
3. Enable "Install from Unknown Sources" in device settings
4. Open APK file to install

### Option B: Build AAB for Google Play Store

For official Play Store submission:

```bash
# Build Android App Bundle
eas build --platform android --profile production
```

**Additional Steps for Play Store**:
1. Download the AAB file
2. Go to [Google Play Console](https://play.google.com/console)
3. Create a new app or select existing
4. Upload AAB to Production/Testing track
5. Complete store listing (screenshots, description, etc.)
6. Submit for review (1-7 days)

### Option C: Build for iOS

```bash
# Build for iOS
eas build --platform ios --profile production
```

**Requirements**:
- Apple Developer Account ($99/year)
- Bundle identifier (e.g., com.yourcompany.pesatracking)

**Distribution Options**:
1. **TestFlight** (Beta Testing):
   - Upload IPA to App Store Connect
   - Add testers
   - Distribute for testing

2. **App Store** (Public Release):
   - Upload to App Store Connect
   - Complete app review process
   - Publish to App Store

## Running in Development Mode

### Test on Your Device (Expo Go)

1. **Install Expo Go** on your device:
   - Android: [Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)
   - iOS: [App Store](https://apps.apple.com/app/expo-go/id982107779)

2. **Start Development Server**:
   ```bash
   npm start
   ```

3. **Scan QR Code**:
   - Android: Use Expo Go app to scan QR code
   - iOS: Use Camera app to scan QR code, then open in Expo Go

### Test on Android Emulator

```bash
npm run android
```

### Test on iOS Simulator (macOS only)

```bash
npm run ios
```

## App Configuration

### Update App Details

Edit `app.json`:

```json
{
  "expo": {
    "name": "Your App Name",
    "slug": "your-app-slug",
    "version": "1.0.0",
    "ios": {
      "bundleIdentifier": "com.yourcompany.appname"
    },
    "android": {
      "package": "com.yourcompany.appname"
    }
  }
}
```

### Update Supabase Configuration

The app is pre-configured with your Supabase credentials in:
- `src/config/supabase.ts`

No changes needed unless you want to use a different Supabase project.

## App Structure

```
mobile-app/
├── src/
│   ├── config/
│   │   └── supabase.ts          # Supabase configuration
│   ├── context/
│   │   └── AuthContext.tsx      # Authentication context
│   ├── screens/
│   │   ├── WorkDashboardScreen.tsx      # Work Dashboard tab
│   │   ├── WorkflowProgressScreen.tsx   # Workflow Progress tab
│   │   ├── WorkflowStepsScreen.tsx      # Steps detail view
│   │   └── StepEditScreen.tsx           # Edit step with camera/GPS
│   ├── types/
│   │   └── index.ts             # TypeScript types
│   └── utils/
│       ├── offlineStorage.ts    # Offline data management
│       └── syncService.ts       # Auto-sync service
├── App.tsx                       # Main app entry
├── app.json                      # Expo configuration
└── package.json                  # Dependencies

## Features Breakdown

### Work Dashboard Tab
- View all works with status badges
- Filter by: Gram Panchayat, Village, Taluka, Category, Status
- Pull-to-refresh to update data
- Tap work to view workflow progress

### Workflow Progress Tab
- List view of all workflows
- Progress bar showing completion percentage
- Statistics: Total steps, completed, days
- Tap workflow to view steps

### Workflow Steps Screen
- Overview: Progress, total steps, completed count
- List of all steps with status
- Tap step to edit and update

### Step Edit Screen
- Change status (Pending/In Progress/Completed)
- **Capture Location** with GPS
- **Take Photos** with camera
- **Pick Photos** from gallery
- **Offline Mode**: Save changes offline, auto-sync when online
- Location shows address and coordinates

## Offline Functionality

The app automatically:
1. **Detects network status**
2. **Saves changes offline** to device storage
3. **Queues updates** for syncing
4. **Auto-syncs** when connection is restored
5. **Shows offline indicator** when no network

Data is stored using:
- AsyncStorage for offline queue
- Local caching for improved performance

## Troubleshooting

### Build Fails

```bash
# Clear cache and rebuild
rm -rf node_modules
npm install
eas build:configure
```

### App Crashes on Start

Check:
1. All dependencies are installed
2. Supabase credentials are correct
3. Device permissions (Camera, Location) are granted

### Camera/Location Not Working

Ensure permissions are granted in:
- **Android**: Settings > Apps > PESA Tracking > Permissions
- **iOS**: Settings > PESA Tracking > Enable Camera & Location

### Sync Not Working

1. Check internet connection
2. Verify Supabase credentials
3. Check browser console for errors

## Publishing Timeline

### Immediate (Today)
- ✅ Build APK
- ✅ Distribute directly via download link or file sharing

### This Week (3-7 days)
- Create Google Play Developer account ($25)
- Prepare store listing materials
- Submit AAB to Play Store
- Wait for review

### iOS (1-2 weeks)
- Enroll in Apple Developer Program ($99/year)
- Configure bundle ID and certificates
- Submit to App Store
- Wait for review (typically 1-3 days)

## Support

For issues or questions:
1. Check this README
2. Review error logs: `npx expo start --clear`
3. Check Expo documentation: https://docs.expo.dev

## Next Steps

1. **Build APK Now** (Option A above)
2. **Test on Device** with Expo Go
3. **Prepare Play Store listing** (screenshots, description)
4. **Submit to Play Store** when ready

---

**Built with**: React Native · Expo · Supabase · TypeScript
